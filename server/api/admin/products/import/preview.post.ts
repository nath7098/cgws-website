import { createRequire } from 'node:module'
import type { H3Event } from 'h3'
import {
  MAX_IMPORT_SIZE_BYTES,
  MAX_IMPORT_LINES,
  CSV_COLUMNS,
  REQUIRED_CSV_COLUMNS,
  validateCsvRow,
  rawToErrorColumns,
  slugifyForImport,
} from '#shared/utils/csvImport'
import type {
  RawCsvRow,
  PreviewRow,
  PreviewRowValid,
  PreviewRowError,
  PreviewResult,
} from '#shared/utils/csvImport'

// papaparse ships a UMD bundle Rollup cannot parse; load it at runtime via
// createRequire (same pattern as pdfmake) so it is never inlined by the bundler.
const _require = createRequire(import.meta.url)
const Papa = _require('papaparse') as typeof import('papaparse')

/**
 * Dry-run preview of a CSV product import (US-063).
 *
 * Parses + validates the uploaded file row by row and returns which rows would
 * be created and which would fail, with a precise reason. Performs **no** DB
 * writes — the only DB access is a read-only slug-collision check.
 *
 * Blocking outcomes (bad encoding, missing required columns, empty file, size
 * or line-count over the limit) are returned as `{ ok: false, error }` (HTTP
 * 200) so the client can surface them in a dedicated alert, rather than thrown
 * as exceptions.
 */
export default defineEventHandler(async (event: H3Event): Promise<PreviewResult> => {
  await requireAdminAuth(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.filename && p.data)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier reçu' })
  }

  const buffer = filePart.data
  if (buffer.byteLength > MAX_IMPORT_SIZE_BYTES) {
    return { ok: false, error: 'Fichier trop volumineux (max 2 Mo)' }
  }

  // Strict UTF-8 decode: a non-UTF-8 byte sequence throws → blocking error.
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  }
  catch {
    return { ok: false, error: 'Encodage non reconnu, veuillez exporter en UTF-8' }
  }
  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

  const parsed = Papa.parse<RawCsvRow>(text, {
    header: true,
    skipEmptyLines: false,
    transformHeader: h => h.trim().toLowerCase(),
  })

  // Required columns present in the header?
  const headers = (parsed.meta.fields ?? []).map(h => h.trim().toLowerCase())
  const missing = REQUIRED_CSV_COLUMNS.filter(c => !headers.includes(c))
  if (missing.length > 0) {
    return { ok: false, error: `Colonnes manquantes : ${missing.join(', ')}` }
  }

  // Keep physical line mapping (header = line 1, first data row = line 2);
  // skip fully-empty rows (e.g. a trailing newline) without breaking numbering.
  const dataRows: Array<{ raw: RawCsvRow, line: number }> = []
  parsed.data.forEach((raw, i) => {
    const line = i + 2
    const isEmpty = CSV_COLUMNS.every(c => !(raw[c] ?? '').trim())
    if (!isEmpty) dataRows.push({ raw, line })
  })

  if (dataRows.length === 0) {
    return { ok: false, error: 'Aucune ligne de données trouvée dans le fichier' }
  }
  if (dataRows.length > MAX_IMPORT_LINES) {
    return { ok: false, error: 'Trop de lignes (max 500 par import)' }
  }

  // Field-level validation + slug computation.
  interface WorkItem { raw: RawCsvRow, line: number, row: PreviewRow, slug: string | null }
  const items: WorkItem[] = dataRows.map(({ raw, line }) => {
    const row = validateCsvRow(raw, line)
    const slug = row.status === 'valid'
      ? slugifyForImport(row.fields.title, row.fields.brand)
      : null
    return { raw, line, row, slug }
  })

  // Intra-file duplicate slugs → the later occurrence is the error.
  const firstLineBySlug = new Map<string, number>()
  for (const it of items) {
    if (it.row.status !== 'valid' || !it.slug) continue
    const first = firstLineBySlug.get(it.slug)
    if (first !== undefined) {
      it.row = {
        line: it.line,
        status: 'error',
        columns: rawToErrorColumns(it.raw),
        reason: `Doublon de slug avec la ligne ${first}`,
      }
    }
    else {
      firstLineBySlug.set(it.slug, it.line)
    }
  }

  // Duplicate slugs against products already in the DB (read-only).
  const candidateSlugs = [
    ...new Set(
      items
        .filter(it => it.row.status === 'valid' && it.slug)
        .map(it => it.slug as string),
    ),
  ]
  if (candidateSlugs.length > 0) {
    const supabase = getAdminSupabase()
    const { data: existing, error } = await supabase
      .from('products')
      .select('slug')
      .in('slug', candidateSlugs)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la vérification des doublons',
      })
    }

    const existingSet = new Set((existing ?? []).map(r => r.slug))
    for (const it of items) {
      if (it.row.status === 'valid' && it.slug && existingSet.has(it.slug)) {
        it.row = {
          line: it.line,
          status: 'error',
          columns: rawToErrorColumns(it.raw),
          reason: `Doublon de slug avec un produit existant : ${it.slug}`,
        }
      }
    }
  }

  const validRows = items
    .filter((it): it is WorkItem & { row: PreviewRowValid } => it.row.status === 'valid')
    .map(it => it.row)
  const errorRows = items
    .filter((it): it is WorkItem & { row: PreviewRowError } => it.row.status === 'error')
    .map(it => it.row)

  return {
    ok: true,
    validRows,
    errorRows,
    summary: {
      valid: validRows.length,
      error: errorRows.length,
      total: items.length,
    },
  }
})

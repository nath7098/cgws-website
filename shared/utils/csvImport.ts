/**
 * Shared CSV import contract & validation logic (US-063).
 *
 * Single source of truth for both the client (dropzone heuristics, preview
 * rendering, composable orchestration) and the server (preview/confirm routes).
 * Lives in `shared/` so it is importable via `#shared/utils/csvImport` from both
 * the Vue app and the Nitro server without front/back duplication.
 *
 * This module is intentionally self-contained (no `~/types` import — the `~`
 * alias is not available in the shared build context). It is therefore the
 * canonical definition of the product category/condition value sets; the domain
 * unions in `app/types/index.ts` are derived from the arrays exported here.
 */

// ─── Limits (shared front/back) ────────────────────────────────────────────────

/** Maximum accepted file size, in megabytes. */
export const MAX_IMPORT_SIZE_MB = 2
/** Maximum accepted file size, in bytes. */
export const MAX_IMPORT_SIZE_BYTES = MAX_IMPORT_SIZE_MB * 1024 * 1024
/** Maximum number of data rows (excluding the header line) accepted per import. */
export const MAX_IMPORT_LINES = 500

// ─── Canonical value sets ──────────────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  'selles',
  'brides-licols',
  'bottes-chaussures',
  'vetements',
  'accessoires',
  'protections',
] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export const PRODUCT_CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

// ─── Display labels (FR) ───────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'selles': 'Selles',
  'brides-licols': 'Brides & Licols',
  'bottes-chaussures': 'Bottes & Chaussures',
  'vetements': 'Vêtements',
  'accessoires': 'Accessoires',
  'protections': 'Protections',
}

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: 'Neuf',
  excellent: 'Excellent',
  good: 'Bon',
  fair: 'Correct',
}

/**
 * Accepted `etat` values (case-insensitive): canonical codes AND the French
 * labels mapped back to the canonical `ProductCondition` (SPRINT_PLAN US-063).
 */
export const CONDITION_ALIASES: Record<string, ProductCondition> = {
  new: 'new',
  neuf: 'new',
  excellent: 'excellent',
  good: 'good',
  bon: 'good',
  fair: 'fair',
  correct: 'fair',
}

// ─── CSV columns ───────────────────────────────────────────────────────────────

/** All recognised CSV columns, in canonical order. */
export const CSV_COLUMNS = [
  'titre',
  'categorie',
  'marque',
  'description',
  'prix',
  'etat',
  'taille',
  'stock',
] as const
export type CsvColumn = (typeof CSV_COLUMNS)[number]

/** Columns that MUST be present in the header AND non-empty on every data row. */
export const REQUIRED_CSV_COLUMNS = ['titre', 'categorie', 'prix', 'etat'] as const

// ─── Preview / confirm data contracts ──────────────────────────────────────────

export interface PreviewRowValidFields {
  title: string
  category: ProductCategory
  brand: string
  description: string
  price: number
  condition: ProductCondition
  size: string
  stock: number
}

export interface PreviewRowValid {
  line: number
  status: 'valid'
  fields: PreviewRowValidFields
}

/** Raw per-column cell values as read from the CSV, for faithful error display. */
export interface PreviewRowErrorColumns {
  titre: string
  categorie: string
  marque: string
  prix: string
  etat: string
  taille: string
  stock: string
}

export interface PreviewRowError {
  line: number
  status: 'error'
  columns: PreviewRowErrorColumns
  reason: string
}

export type PreviewRow = PreviewRowValid | PreviewRowError

export interface ImportSummary {
  valid: number
  error: number
  total: number
}

/** Successful (non-blocking) preview response. */
export interface PreviewSuccess {
  ok: true
  validRows: PreviewRowValid[]
  errorRows: PreviewRowError[]
  summary: ImportSummary
}

/** Blocking preview outcome (encoding / missing columns / empty / size / lines). */
export interface PreviewBlocked {
  ok: false
  error: string
}

export type PreviewResult = PreviewSuccess | PreviewBlocked

export interface ConfirmCreated {
  id: string
  title: string
  slug: string
}

export interface ConfirmFailure {
  line: number
  reason: string
}

export interface ConfirmResponse {
  created: ConfirmCreated[]
  failed: ConfirmFailure[]
}

// ─── Raw CSV record ────────────────────────────────────────────────────────────

/** A single parsed CSV record, keyed by (lowercased) header name. */
export type RawCsvRow = Partial<Record<string, string>>

// ─── Validation primitives ─────────────────────────────────────────────────────

export function normalizeCategory(raw: string): ProductCategory | null {
  const key = raw.trim().toLowerCase()
  return (PRODUCT_CATEGORIES as readonly string[]).includes(key)
    ? (key as ProductCategory)
    : null
}

export function normalizeCondition(raw: string): ProductCondition | null {
  const key = raw.trim().toLowerCase()
  return CONDITION_ALIASES[key] ?? null
}

/**
 * Parses a price cell. Accepts an integer or decimal with a `.` separator; a
 * single `,` is tolerated as a decimal separator (common in French exports of a
 * quoted field). Returns `null` when the value is not numeric.
 */
export function parsePrice(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** Parses a stock cell as a non-negative integer. Returns `null` when invalid. */
export function parseStock(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** Extracts the raw per-column cell values (trimmed) for faithful error display. */
export function rawToErrorColumns(raw: RawCsvRow): PreviewRowErrorColumns {
  return {
    titre: (raw.titre ?? '').trim(),
    categorie: (raw.categorie ?? '').trim(),
    marque: (raw.marque ?? '').trim(),
    prix: (raw.prix ?? '').trim(),
    etat: (raw.etat ?? '').trim(),
    taille: (raw.taille ?? '').trim(),
    stock: (raw.stock ?? '').trim(),
  }
}

/**
 * Validates a single raw CSV record into a valid or error preview row.
 * Pure & side-effect free — slug uniqueness (which needs DB access) is handled
 * separately at confirm time. `line` is the 1-based line number in the file
 * (header = line 1, first data row = line 2).
 */
export function validateCsvRow(raw: RawCsvRow, line: number): PreviewRow {
  const columns = rawToErrorColumns(raw)
  const description = (raw.description ?? '').trim()

  const err = (reason: string): PreviewRowError => ({ line, status: 'error', columns, reason })

  if (!columns.titre) return err('Champ requis manquant : titre')

  if (!columns.categorie) return err('Champ requis manquant : categorie')
  const category = normalizeCategory(columns.categorie)
  if (!category) return err(`Catégorie inconnue : ${columns.categorie}`)

  if (!columns.prix) return err('Champ requis manquant : prix')
  const price = parsePrice(columns.prix)
  if (price === null) return err(`Prix non numérique : '${columns.prix}'`)
  if (price <= 0) return err(`Prix invalide (doit être supérieur à 0) : '${columns.prix}'`)

  if (!columns.etat) return err('Champ requis manquant : etat')
  const condition = normalizeCondition(columns.etat)
  if (!condition) return err(`État inconnu : ${columns.etat}`)

  let stock = 1
  if (columns.stock) {
    const parsed = parseStock(columns.stock)
    if (parsed === null) return err(`Stock invalide : '${columns.stock}'`)
    stock = parsed
  }

  return {
    line,
    status: 'valid',
    fields: {
      title: columns.titre,
      category,
      brand: columns.marque,
      description,
      price,
      condition,
      size: columns.taille,
      stock,
    },
  }
}

/**
 * Slugify used at preview time for intra-file duplicate detection. Mirrors the
 * server-side `slugify` in `server/utils/adminSupabase.ts` (kept in sync — same
 * normalization rules) so a preview-detected duplicate matches what confirm
 * would produce. Combined `title + brand`, matching `generateUniqueSlug`.
 */
export function slugifyForImport(title: string, brand: string): string {
  return `${title} ${brand}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

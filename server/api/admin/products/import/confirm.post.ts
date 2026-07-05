import { z } from 'zod'
import type { H3Event } from 'h3'
import {
  MAX_IMPORT_LINES,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  slugifyForImport,
} from '#shared/utils/csvImport'
import type { ConfirmResponse, ConfirmCreated, ConfirmFailure } from '#shared/utils/csvImport'

/**
 * Commits a previously-previewed CSV import (US-063).
 *
 * Receives the EXACT `validRows` array returned by the preview step as JSON —
 * not the re-uploaded CSV — so the serverless flow stays stateless. Each row is
 * re-validated server-side (never trust the client), then inserted one by one.
 *
 * Concurrency protection (preview ↔ confirm): the target slug is derived and
 * inserted directly; the DB `slug` UNIQUE constraint is the arbiter. If a
 * product with the same slug was created in the meantime, the insert fails with
 * a unique violation (Postgres 23505) and that single row is reported as failed
 * while every other valid row is still created — the import never fails
 * globally for one conflict. (`generateUniqueSlug`'s auto-suffixing is
 * deliberately NOT used here: it would silently create a near-duplicate instead
 * of surfacing the conflict the acceptance criteria require.)
 */

const rowSchema = z.object({
  line: z.number().int(),
  status: z.literal('valid'),
  fields: z.object({
    title: z.string().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    brand: z.string(),
    description: z.string(),
    price: z.number().positive(),
    condition: z.enum(PRODUCT_CONDITIONS),
    size: z.string(),
    stock: z.number().int().min(0),
  }),
})

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_IMPORT_LINES),
})

export default defineEventHandler(async (event: H3Event): Promise<ConfirmResponse> => {
  await requireAdminAuth(event)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Données d'import invalides",
    })
  }

  const supabase = getAdminSupabase()
  const created: ConfirmCreated[] = []
  const failed: ConfirmFailure[] = []

  for (const row of parsed.data.rows) {
    const f = row.fields
    const slug = slugifyForImport(f.title, f.brand)
    const id = crypto.randomUUID()

    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        slug,
        title: f.title,
        description: f.description || null,
        price: f.price,
        category: f.category,
        brand: f.brand || null,
        size: f.size || null,
        condition: f.condition,
        is_consignment: false,
        consignment_id: null,
        status: 'active',
        images: [],
        stock: f.stock,
      })
      .select('id, title, slug')
      .single()

    if (error || !data) {
      const code = (error as { code?: string } | null)?.code
      failed.push({
        line: row.line,
        reason: code === '23505'
          ? `Doublon de slug avec un produit existant : ${slug}`
          : 'Erreur lors de la création du produit',
      })
      continue
    }

    created.push({ id: data.id, title: data.title, slug: data.slug })
  }

  return { created, failed }
})

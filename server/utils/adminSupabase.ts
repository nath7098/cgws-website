import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { Consignment, ConsignmentStatus, ProductCondition } from '~/types'

// ─── Narrowing DB text → unions du domaine ───────────────────────────────────
// Les colonnes `condition`/`status` sont `text` en base (avec contrainte CHECK
// sur exactement ces valeurs — migration 001) mais typées `string` par le
// générateur Supabase. On valide à l'exécution via type predicate plutôt que
// de caster aveuglément ; le fallback ne peut se produire que si la contrainte
// CHECK a été contournée.

const PRODUCT_CONDITIONS: readonly ProductCondition[] = ['new', 'excellent', 'good', 'fair']
const CONSIGNMENT_STATUSES: readonly ConsignmentStatus[] = ['pending', 'accepted', 'rejected', 'sold', 'returned']

function isProductCondition(value: string): value is ProductCondition {
  return PRODUCT_CONDITIONS.some(c => c === value)
}

function isConsignmentStatus(value: string): value is ConsignmentStatus {
  return CONSIGNMENT_STATUSES.some(s => s === value)
}

/**
 * Nettoie une valeur de credential (URL / clé) avant de la passer au client
 * Supabase, comme `useSupabase()` côté public. Une variable d'env Vercel sale
 * (BOM UTF-8 U+FEFF collé en tête de l'URL, caractère non-Latin1 dans la clé —
 * voir issue #16) fait échouer TOUTES les requêtes du client admin en
 * production (503/headers invalides), alors que la même clé fonctionne en
 * local. On retire tout ce qui n'est pas de l'ASCII imprimable pour rendre le
 * service role robuste à un env var mal saisi. Symétrique de `sanitizeCredential`
 * dans `app/composables/useSupabase.ts`.
 */
function sanitizeCredential(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '')
}

/**
 * Returns a Supabase admin client using the service role key.
 * Bypasses RLS — use only for server-side admin operations.
 */
export function getAdminSupabase() {
  const config = useRuntimeConfig()
  return createClient<Database>(
    sanitizeCredential(config.public.supabaseUrl as string),
    sanitizeCredential(config.supabaseServiceRoleKey as string),
  )
}

/**
 * Generates a URL-safe slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generates a unique slug by checking existing slugs in the DB.
 * Appends -2, -3, etc. on collision, excluding the current product's own ID.
 */
export async function generateUniqueSlug(
  supabase: ReturnType<typeof getAdminSupabase>,
  title: string,
  brand: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(`${title} ${brand}`.trim())

  let query = supabase
    .from('products')
    .select('slug')
    .like('slug', `${base}%`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query
  const existing = new Set(data?.map(r => r.slug) ?? [])

  if (!existing.has(base)) return base

  let counter = 2
  while (existing.has(`${base}-${counter}`)) counter++
  return `${base}-${counter}`
}

/**
 * Extracts the Supabase Storage path from a public URL.
 * Input:  https://xxx.supabase.co/storage/v1/object/public/product-images/products/abc/file.jpg
 * Output: products/abc/file.jpg
 */
export function storagePathFromUrl(publicUrl: string): string | null {
  const marker = '/product-images/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

/**
 * Maps a DB consignment row (snake_case) to the Consignment domain type (camelCase).
 */
export function mapConsignmentRow(row: {
  id: string
  depositor_name: string
  depositor_email: string
  depositor_phone: string | null
  item_description: string
  brand: string | null
  condition: string
  asking_price: number
  agreed_price: number | null
  images: string[] | null
  status: string | null
  notes: string | null
  created_at: string | null
}): Consignment {
  return {
    id: row.id,
    depositorName: row.depositor_name,
    depositorEmail: row.depositor_email,
    depositorPhone: row.depositor_phone ?? '',
    itemDescription: row.item_description,
    brand: row.brand ?? '',
    condition: isProductCondition(row.condition) ? row.condition : 'good',
    askingPrice: row.asking_price,
    agreedPrice: row.agreed_price ?? undefined,
    images: row.images ?? [],
    status: row.status !== null && isConsignmentStatus(row.status) ? row.status : 'pending',
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? '',
  }
}

/**
 * Maps a DB product row (snake_case) to the Product domain type (camelCase).
 */
export function mapProductRow(row: {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  category: string
  brand: string | null
  size: string | null
  condition: string
  is_consignment: boolean | null
  consignment_id: string | null
  status: string | null
  images: string[] | null
  stock: number | null
  camille_approved?: boolean | null
  created_at: string | null
  updated_at: string | null
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    price: row.price,
    category: row.category,
    brand: row.brand ?? '',
    size: row.size ?? undefined,
    condition: row.condition,
    isConsignment: row.is_consignment ?? false,
    consignmentId: row.consignment_id ?? undefined,
    status: row.status ?? 'active',
    images: row.images ?? [],
    stock: row.stock ?? 1,
    camilleApproved: row.camille_approved ?? false,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

/**
 * Returns a Supabase admin client using the service role key.
 * Bypasses RLS — use only for server-side admin operations.
 */
export function getAdminSupabase() {
  const config = useRuntimeConfig()
  return createClient<Database>(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string,
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
}) {
  return {
    id: row.id,
    depositorName: row.depositor_name,
    depositorEmail: row.depositor_email,
    depositorPhone: row.depositor_phone ?? '',
    itemDescription: row.item_description,
    brand: row.brand ?? '',
    condition: row.condition,
    askingPrice: row.asking_price,
    agreedPrice: row.agreed_price ?? undefined,
    images: row.images ?? [],
    status: row.status ?? 'pending',
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
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

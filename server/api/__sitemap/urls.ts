import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl as string
  const serviceRoleKey = config.supabaseServiceRoleKey as string

  if (!supabaseUrl || !serviceRoleKey) return []

  const client = createClient<Database>(supabaseUrl, serviceRoleKey)

  const { data: products, error } = await client
    .from('products')
    .select('slug, updated_at, status')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error || !products) return []

  return products.map((p) => ({
    loc: `/catalogue/${p.slug}`,
    lastmod: p.updated_at ?? new Date().toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.7,
  }))
})

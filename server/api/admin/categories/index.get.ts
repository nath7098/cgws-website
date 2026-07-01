import type { H3Event } from 'h3'
import type { CategoryWithMeta } from '~/types'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()

  const { data: rawCategories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (catErr) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des catégories',
    })
  }

  const { data: productRows } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')

  const countMap: Record<string, number> = {}
  for (const row of productRows ?? []) {
    if (row.category) {
      countMap[row.category] = (countMap[row.category] ?? 0) + 1
    }
  }

  const categories = rawCategories ?? []

  const roots: CategoryWithMeta[] = categories
    .filter(c => c.parent_id === null)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: null,
      sortOrder: c.sort_order ?? 0,
      isActive: c.is_active ?? true,
      productCount: countMap[c.slug] ?? 0,
      children: categories
        .filter(child => child.parent_id === c.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          parentId: child.parent_id,
          sortOrder: child.sort_order ?? 0,
          isActive: child.is_active ?? true,
          productCount: countMap[child.slug] ?? 0,
          children: [],
        })),
    }))

  return { categories: roots }
})

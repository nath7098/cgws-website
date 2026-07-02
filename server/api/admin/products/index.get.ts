import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const category = typeof query.category === 'string' ? query.category.trim() : ''
  const status = typeof query.status === 'string' ? query.status.trim() : ''

  let dbQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    dbQuery = dbQuery.or(`title.ilike.%${search}%,brand.ilike.%${search}%`)
  }
  if (category) {
    dbQuery = dbQuery.eq('category', category)
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status)
  }

  dbQuery = dbQuery.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await dbQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des produits',
    })
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit) || 1

  return {
    items: (data ?? []).map(mapProductRow),
    total,
    page,
    totalPages,
  }
})

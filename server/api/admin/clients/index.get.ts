import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const rawQuery = getQuery(event)

  const page = Math.max(1, Number(rawQuery.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(rawQuery.limit) || 20))
  const search = typeof rawQuery.search === 'string' && rawQuery.search.trim()
    ? rawQuery.search.trim()
    : undefined
  const offset = (page - 1) * limit

  // ─── Build clients query ────────────────────────────────────────────────────

  let clientsQuery = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    clientsQuery = clientsQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: clientsData, count, error: clientsError } = await clientsQuery

  if (clientsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des clients',
    })
  }

  const clients = clientsData ?? []

  // ─── Fetch purchase aggregates ──────────────────────────────────────────────

  const purchaseCountMap = new Map<string, number>()
  const lastPurchaseDateMap = new Map<string, string>()

  if (clients.length > 0) {
    const clientIds = clients.map(c => c.id)
    const { data: salesData } = await supabase
      .from('sales')
      .select('client_id, sale_date')
      .in('client_id', clientIds)
      .order('sale_date', { ascending: false })

    if (salesData) {
      for (const sale of salesData) {
        if (!sale.client_id) continue
        const current = purchaseCountMap.get(sale.client_id) ?? 0
        purchaseCountMap.set(sale.client_id, current + 1)
        if (!lastPurchaseDateMap.has(sale.client_id)) {
          lastPurchaseDateMap.set(sale.client_id, sale.sale_date)
        }
      }
    }
  }

  // ─── Map and enrich ─────────────────────────────────────────────────────────

  const enrichedClients = clients.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    address: c.address ?? undefined,
    notes: c.notes ?? undefined,
    createdAt: c.created_at ?? '',
    purchaseCount: purchaseCountMap.get(c.id) ?? 0,
    lastPurchaseDate: lastPurchaseDateMap.get(c.id) ?? null,
  }))

  return {
    clients: enrichedClients,
    total: count ?? 0,
  }
})

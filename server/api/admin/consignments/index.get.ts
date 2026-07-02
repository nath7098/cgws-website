import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const status = typeof query.status === 'string' ? query.status.trim() : ''

  const offset = (page - 1) * limit

  // Always count global pending (no filters) for the header badge
  const { count: globalPendingCount } = await supabase
    .from('consignments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const pendingCount = globalPendingCount ?? 0

  // When a specific status filter is applied, use a simple single query
  if (status) {
    let q = supabase
      .from('consignments')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (search) {
      q = q.ilike('depositor_name', `%${search}%`)
    }

    q = q.range(offset, offset + limit - 1)

    const { data, error, count } = await q

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des consignations',
      })
    }

    const total = count ?? 0

    return {
      items: (data ?? []).map(mapConsignmentRow),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      pendingCount,
    }
  }

  // No status filter: pending-first ordering via two sequential queries
  // 1. Count pending items matching search filter
  let pendingCountQ = supabase
    .from('consignments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (search) {
    pendingCountQ = pendingCountQ.ilike('depositor_name', `%${search}%`)
  }

  const { count: filteredPendingCount } = await pendingCountQ
  const pCount = filteredPendingCount ?? 0

  // 2. Count all items matching search filter
  let totalCountQ = supabase
    .from('consignments')
    .select('id', { count: 'exact', head: true })

  if (search) {
    totalCountQ = totalCountQ.ilike('depositor_name', `%${search}%`)
  }

  const { count: totalCount } = await totalCountQ
  const total = totalCount ?? 0

  if (total === 0) {
    return {
      items: [],
      total: 0,
      page,
      totalPages: 1,
      pendingCount,
    }
  }

  const items = await (async (): Promise<ReturnType<typeof mapConsignmentRow>[]> => {
    if (pCount === 0 || offset >= pCount) {
      // Page is entirely in non-pending territory
      const restOffset = pCount === 0 ? offset : offset - pCount

      let rQ = supabase
        .from('consignments')
        .select('*')
        .neq('status', 'pending')
        .order('created_at', { ascending: false })

      if (search) {
        rQ = rQ.ilike('depositor_name', `%${search}%`)
      }

      rQ = rQ.range(restOffset, restOffset + limit - 1)

      const { data: rData, error: rErr } = await rQ

      if (rErr) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la récupération des consignations',
        })
      }

      return (rData ?? []).map(mapConsignmentRow)
    }

    // Page starts in pending territory
    const pendingNeeded = Math.min(limit, pCount - offset)

    let pQ = supabase
      .from('consignments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (search) {
      pQ = pQ.ilike('depositor_name', `%${search}%`)
    }

    pQ = pQ.range(offset, offset + pendingNeeded - 1)

    const { data: pData, error: pErr } = await pQ

    if (pErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des consignations',
      })
    }

    const pendingItems = (pData ?? []).map(mapConsignmentRow)
    const restNeeded = limit - pendingNeeded

    if (restNeeded <= 0) return pendingItems

    let rQ = supabase
      .from('consignments')
      .select('*')
      .neq('status', 'pending')
      .order('created_at', { ascending: false })

    if (search) {
      rQ = rQ.ilike('depositor_name', `%${search}%`)
    }

    rQ = rQ.range(0, restNeeded - 1)

    const { data: rData, error: rErr } = await rQ

    if (rErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des consignations',
      })
    }

    return [...pendingItems, ...(rData ?? []).map(mapConsignmentRow)]
  })()

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    pendingCount,
  }
})

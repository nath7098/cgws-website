import type { H3Event } from 'h3'

interface SaleRowProduct {
  title: string
  brand: string | null
  is_consignment: boolean | null
}

interface SaleRowClient {
  name: string
}

interface SaleRow {
  id: string
  product_id: string
  sale_price: number
  sale_date: string
  payment_method: string
  commission_amount: number | null
  notes: string | null
  products: SaleRowProduct
  clients: SaleRowClient | null
}

function buildMonthBounds(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr!, 10)
  const monthNum = parseInt(monthStr!, 10) // 1-indexed
  // Next month (JS Date uses 0-indexed months: monthNum is already correct as 0-indexed next month)
  const nextDate = new Date(year, monthNum, 1)
  const nextYear = nextDate.getFullYear()
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0')
  return {
    start: `${month}-01`,
    end: `${nextYear}-${nextMonth}-01`,
  }
}

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const rawQuery = getQuery(event)

  const month = typeof rawQuery.month === 'string' && /^\d{4}-\d{2}$/.test(rawQuery.month)
    ? rawQuery.month
    : undefined
  const type = typeof rawQuery.type === 'string' ? rawQuery.type : undefined
  const page = Math.max(1, Number(rawQuery.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(rawQuery.limit) || 20))
  const offset = (page - 1) * limit

  // ─── Filtered sales query ──────────────────────────────────────────────────

  let salesQuery = supabase
    .from('sales')
    .select(
      '*, products!inner(title, brand, is_consignment), clients(name)',
      { count: 'exact' },
    )
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (month) {
    const { start, end } = buildMonthBounds(month)
    salesQuery = salesQuery.gte('sale_date', start).lt('sale_date', end)
  }

  if (type === 'own') {
    salesQuery = salesQuery.eq('products.is_consignment', false)
  }
  else if (type === 'consignment') {
    salesQuery = salesQuery.eq('products.is_consignment', true)
  }

  salesQuery = salesQuery.range(offset, offset + limit - 1)

  const { data: salesData, error: salesError, count } = await salesQuery

  if (salesError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des ventes',
    })
  }

  // ─── Summary — always computed on ALL sales (ignoring filters) ─────────────

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { start: monthStart, end: monthEnd } = buildMonthBounds(currentMonth)

  const [monthResult, totalResult] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_price')
      .gte('sale_date', monthStart)
      .lt('sale_date', monthEnd),
    supabase
      .from('sales')
      .select('sale_price'),
  ])

  const caMonth = (monthResult.data ?? []).reduce((sum, s) => sum + Number(s.sale_price), 0)
  const salesMonth = monthResult.data?.length ?? 0
  const caTotal = (totalResult.data ?? []).reduce((sum, s) => sum + Number(s.sale_price), 0)
  const salesTotal = totalResult.data?.length ?? 0

  // ─── Map rows ─────────────────────────────────────────────────────────────

  const rows = salesData as SaleRow[] | null

  const sales = (rows ?? []).map(s => ({
    id: s.id,
    productId: s.product_id,
    productTitle: s.products.title,
    productBrand: s.products.brand ?? '',
    isConsignment: s.products.is_consignment ?? false,
    salePrice: Number(s.sale_price),
    saleDate: s.sale_date,
    paymentMethod: s.payment_method,
    clientName: s.clients?.name ?? null,
    commissionAmount: s.commission_amount !== null ? Number(s.commission_amount) : null,
    notes: s.notes ?? null,
  }))

  return {
    sales,
    total: count ?? 0,
    summary: {
      caMonth,
      caTotal,
      salesMonth,
      salesTotal,
    },
  }
})

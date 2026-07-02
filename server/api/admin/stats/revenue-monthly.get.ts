import type { H3Event } from 'h3'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
  sale_date: string
  sale_price: number
  products: { is_consignment: boolean | null }
}

interface MonthBucket {
  own: number
  consignment: number
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()

  // Build the array of the last 12 months (inclusive of the current month)
  const now = new Date()
  const months: string[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }

  // Earliest date needed
  const startDate = `${months[0]!}-01`

  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, sale_price, products!inner(is_consignment)')
    .gte('sale_date', startDate)
    .order('sale_date', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des statistiques de CA',
    })
  }

  // Initialise buckets for each month
  const byMonth = new Map<string, MonthBucket>()
  for (const m of months) {
    byMonth.set(m, { own: 0, consignment: 0 })
  }

  // Aggregate rows
  const rows = (data ?? []) as SaleRow[]
  for (const sale of rows) {
    const monthKey = sale.sale_date.slice(0, 7)
    const bucket = byMonth.get(monthKey)
    if (!bucket) continue

    const price = Number(sale.sale_price)
    const isConsignment = (sale.products as { is_consignment: boolean | null }).is_consignment ?? false

    if (isConsignment) {
      bucket.consignment += price
    }
    else {
      bucket.own += price
    }
  }

  // Return ordered array
  return months.map(m => {
    const bucket = byMonth.get(m) ?? { own: 0, consignment: 0 }
    return {
      month: m,
      ownRevenue: Math.round(bucket.own * 100) / 100,
      consignmentRevenue: Math.round(bucket.consignment * 100) / 100,
    }
  })
})

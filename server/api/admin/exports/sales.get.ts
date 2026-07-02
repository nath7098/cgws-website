import type { H3Event } from 'h3'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleProductJoin {
  title: string
  brand: string | null
  is_consignment: boolean | null
}

interface SaleClientJoin {
  name: string
}

interface SaleRow {
  id: string
  sale_date: string
  sale_price: number
  payment_method: string
  commission_amount: number | null
  notes: string | null
  products: SaleProductJoin
  clients: SaleClientJoin | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escapes a cell value for CSV (RFC 4180). Always wraps in double-quotes. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function formatAmount(n: number): string {
  return n.toFixed(2)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const rawQuery = getQuery(event)
  const from = typeof rawQuery.from === 'string' ? rawQuery.from : null
  const to = typeof rawQuery.to === 'string' ? rawQuery.to : null

  if (!from || !to) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Paramètres "from" et "to" requis (format YYYY-MM-DD)',
    })
  }

  // Validate date format (loose check)
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format de date invalide — attendu YYYY-MM-DD',
    })
  }

  if (from > to) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La date de début doit être antérieure ou égale à la date de fin',
    })
  }

  const supabase = getAdminSupabase()

  const { data, error } = await supabase
    .from('sales')
    .select('id, sale_date, sale_price, payment_method, commission_amount, notes, products!inner(title, brand, is_consignment), clients(name)')
    .gte('sale_date', from)
    .lte('sale_date', to)
    .order('sale_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des ventes',
    })
  }

  const rows = (data ?? []) as SaleRow[]

  // ─── Build CSV ─────────────────────────────────────────────────────────────

  const headers = [
    'date',
    'produit',
    'prix_vente',
    'type',
    'client',
    'commission',
    'net_deposant',
  ]

  const csvLines: string[] = [
    headers.map(csvCell).join(';'),
  ]

  for (const sale of rows) {
    const product = sale.products as SaleProductJoin
    const client = sale.clients as SaleClientJoin | null
    const isConsignment = product.is_consignment ?? false
    const salePrice = Number(sale.sale_price)
    const commission = sale.commission_amount !== null ? Number(sale.commission_amount) : null
    const netDeposant = commission !== null ? salePrice - commission : null

    const productLabel = product.brand
      ? `${product.title} (${product.brand})`
      : product.title

    csvLines.push([
      csvCell(sale.sale_date),
      csvCell(productLabel),
      csvCell(formatAmount(salePrice)),
      csvCell(isConsignment ? 'consignation' : 'propre'),
      csvCell(client?.name ?? ''),
      csvCell(commission !== null ? formatAmount(commission) : ''),
      csvCell(netDeposant !== null ? formatAmount(netDeposant) : ''),
    ].join(';'))
  }

  // UTF-8 BOM for Excel compatibility
  const BOM = '﻿'
  const csvContent = BOM + csvLines.join('\r\n')

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="cgws-ventes-${from}-${to}.csv"`,
  )
  setResponseHeader(event, 'X-Record-Count', String(rows.length))

  return csvContent
})

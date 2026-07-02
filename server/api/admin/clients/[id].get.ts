import type { H3Event } from 'h3'
import type { Client, ClientPurchase, Consignment, PaymentMethod } from '~/types'

interface PurchaseRow {
  id: string
  sale_price: number
  payment_method: string
  sale_date: string
  products: { title: string; brand: string | null } | null
}

interface ClientDetailResponse {
  client: Client
  purchases: ClientPurchase[]
  consignments: Consignment[]
}

export default defineEventHandler(async (event: H3Event): Promise<ClientDetailResponse> => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID client manquant' })
  }

  // ─── Fetch client ───────────────────────────────────────────────────────────

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (clientError) {
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la récupération du client' })
  }

  if (!clientData) {
    throw createError({ statusCode: 404, statusMessage: 'Client introuvable' })
  }

  const client: Client = {
    id: clientData.id,
    name: clientData.name,
    email: clientData.email ?? undefined,
    phone: clientData.phone ?? undefined,
    address: clientData.address ?? undefined,
    notes: clientData.notes ?? undefined,
    createdAt: clientData.created_at ?? '',
  }

  // ─── Fetch last 10 purchases with product info ──────────────────────────────

  const { data: purchasesData } = await supabase
    .from('sales')
    .select('id, sale_price, payment_method, sale_date, products(title, brand)')
    .eq('client_id', id)
    .order('sale_date', { ascending: false })
    .limit(10)

  const purchases: ClientPurchase[] = ((purchasesData as PurchaseRow[] | null) ?? []).map(s => ({
    id: s.id,
    productTitle: s.products?.title ?? '—',
    productBrand: s.products?.brand ?? '',
    salePrice: Number(s.sale_price),
    paymentMethod: s.payment_method as PaymentMethod,
    saleDate: s.sale_date,
  }))

  // ─── Fetch consignments by depositor_email ──────────────────────────────────

  let consignments: Consignment[] = []
  if (client.email) {
    const { data: consignmentsData } = await supabase
      .from('consignments')
      .select('*')
      .eq('depositor_email', client.email)
      .order('created_at', { ascending: false })

    consignments = (consignmentsData ?? []).map(mapConsignmentRow)
  }

  return { client, purchases, consignments }
})

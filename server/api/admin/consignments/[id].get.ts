import type { H3Event } from 'h3'
import type { ProductStatus, PaymentMethod } from '~/types'

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  // 1. Fetch the consignment
  const { data: cons, error: consErr } = await supabase
    .from('consignments')
    .select('*')
    .eq('id', id)
    .single()

  if (consErr || !cons) {
    throw createError({ statusCode: 404, statusMessage: 'Consignation introuvable' })
  }

  // 2. Fetch the linked product (if accepted or sold)
  let linkedProduct: {
    id: string
    title: string
    status: ProductStatus
    slug: string
  } | undefined

  if (cons.status === 'accepted' || cons.status === 'sold') {
    const { data: prod } = await supabase
      .from('products')
      .select('id, title, status, slug')
      .eq('consignment_id', id)
      .maybeSingle()

    if (prod) {
      linkedProduct = {
        id: prod.id,
        title: prod.title,
        status: (prod.status ?? 'active') as ProductStatus,
        slug: prod.slug,
      }
    }
  }

  // 3. Fetch the linked sale (if sold and product is known)
  let linkedSale: {
    salePrice: number
    commissionAmount: number
    saleDate: string
    paymentMethod: PaymentMethod
  } | undefined

  if (cons.status === 'sold' && linkedProduct) {
    const { data: sale } = await supabase
      .from('sales')
      .select('sale_price, commission_amount, sale_date, payment_method')
      .eq('product_id', linkedProduct.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sale) {
      linkedSale = {
        salePrice: sale.sale_price,
        commissionAmount: sale.commission_amount ?? 0,
        saleDate: sale.sale_date,
        paymentMethod: (sale.payment_method ?? 'cash') as PaymentMethod,
      }
    }
  }

  return {
    consignment: mapConsignmentRow(cons),
    linkedProduct,
    linkedSale,
  }
})

import { z } from 'zod'
import type { H3Event } from 'h3'
import { sendConsignmentSaleEmail } from '~~/server/services/email'

const saleSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  salePrice: z.number().positive('Le prix de vente doit être supérieur à 0'),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (attendu : YYYY-MM-DD)'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check'], {
    error: 'Moyen de paiement invalide',
  }),
  clientId: z.string().uuid().nullable().optional(),
  clientName: z.string().optional(),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const body = await readBody(event)

  // ─── Validate input ────────────────────────────────────────────────────────

  const parseResult = saleSchema.safeParse(body)
  if (!parseResult.success) {
    const flat = parseResult.error.flatten()
    const firstError
      = Object.values(flat.fieldErrors).flat()[0]
      ?? flat.formErrors[0]
      ?? 'Données invalides'
    throw createError({ statusCode: 422, statusMessage: firstError })
  }

  const input = parseResult.data

  // ─── Fetch product (with consignment) ─────────────────────────────────────

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, status, is_consignment, consignment_id, price')
    .eq('id', input.productId)
    .single()

  if (productError || !product) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  if (product.status !== 'active') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce produit n\'est plus disponible à la vente (déjà vendu ou inactif)',
    })
  }

  // ─── Fetch consignment if applicable (for commission & email) ─────────────

  let agreedPrice: number | null = null
  let consignmentData: {
    id: string
    depositor_name: string
    depositor_email: string
    item_description: string
    agreed_price: number | null
  } | null = null

  if (product.is_consignment && product.consignment_id) {
    const { data: consignment } = await supabase
      .from('consignments')
      .select('id, depositor_name, depositor_email, item_description, agreed_price')
      .eq('id', product.consignment_id)
      .single()

    if (consignment) {
      consignmentData = consignment
      agreedPrice = consignment.agreed_price !== null ? Number(consignment.agreed_price) : null
    }
  }

  // ─── Calculate commission ─────────────────────────────────────────────────

  let commissionAmount: number | null = null
  if (product.is_consignment && agreedPrice !== null) {
    commissionAmount = input.salePrice - agreedPrice
  }

  // ─── Resolve client record ────────────────────────────────────────────────

  let clientId: string | null = null

  if (input.clientId) {
    // Existing client selected — verify it exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', input.clientId)
      .maybeSingle()

    if (existingClient) clientId = existingClient.id
  }
  else if (input.clientName?.trim()) {
    // Create client on the fly from free-text name
    const { data: newClient } = await supabase
      .from('clients')
      .insert({ name: input.clientName.trim() })
      .select('id')
      .single()

    if (newClient) clientId = newClient.id
  }
  // else clientId remains null

  // ─── Insert sale ───────────────────────────────────────────────────────────

  const { data: sale, error: insertErr } = await supabase
    .from('sales')
    .insert({
      product_id: input.productId,
      client_id: clientId,
      sale_price: input.salePrice,
      sale_date: input.saleDate,
      payment_method: input.paymentMethod,
      commission_amount: commissionAmount,
      notes: input.notes ?? null,
    })
    .select('id, product_id, sale_price, sale_date, payment_method, commission_amount')
    .single()

  if (insertErr || !sale) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'enregistrement de la vente',
    })
  }

  // ─── Update product status to 'sold' ──────────────────────────────────────

  await supabase
    .from('products')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', input.productId)

  // ─── Insert status history ────────────────────────────────────────────────

  await supabase
    .from('product_status_history')
    .insert({
      product_id: input.productId,
      old_status: 'active',
      new_status: 'sold',
      changed_by: 'admin',
    })

  // ─── Send consignment sale email (non-blocking) ───────────────────────────

  if (product.is_consignment && consignmentData) {
    const config = useRuntimeConfig()
    const apiKey = config.resendApiKey as string | undefined

    if (apiKey) {
      // Awaité impérativement : en serverless (Vercel), un fire-and-forget est
      // gelé/tué dès que la réponse part — l'email n'est jamais envoyé.
      try {
        await sendConsignmentSaleEmail(apiKey, {
          depositorName: consignmentData.depositor_name,
          depositorEmail: consignmentData.depositor_email,
          itemDescription: consignmentData.item_description,
          salePrice: input.salePrice,
          commissionAmount,
          agreedPrice,
          consignmentId: consignmentData.id,
        })
      }
      catch {
        // Non-bloquant : l'échec d'email n'affecte pas la vente.
      }
    }
  }

  // ─── Response ─────────────────────────────────────────────────────────────

  setResponseStatus(event, 201)

  return {
    sale: {
      id: sale.id as string,
      productId: sale.product_id as string,
      salePrice: Number(sale.sale_price),
      saleDate: sale.sale_date as string,
      paymentMethod: sale.payment_method as string,
      commissionAmount: sale.commission_amount !== null ? Number(sale.commission_amount) : null,
    },
  }
})

import { z } from 'zod'
import type { H3Event } from 'h3'

const saleSchema = z.object({
  productId: z.string().uuid('ID produit invalide'),
  salePrice: z.number().positive('Le prix de vente doit être supérieur à 0'),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (attendu : YYYY-MM-DD)'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check'], {
    error: 'Moyen de paiement invalide',
  }),
  clientName: z.string().optional(),
  notes: z.string().optional(),
})

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const supabase = getAdminSupabase()
  const body = await readBody(event)

  const parseResult = saleSchema.safeParse(body)
  if (!parseResult.success) {
    const flat = parseResult.error.flatten()
    const firstError = Object.values(flat.fieldErrors).flat()[0]
      ?? flat.formErrors[0]
      ?? 'Données invalides'
    throw createError({ statusCode: 422, statusMessage: firstError })
  }

  const input = parseResult.data

  // Optionally create/find a client record if clientName is provided
  let clientId: string | null = null
  if (input.clientName?.trim()) {
    const { data: createdClient } = await supabase
      .from('clients')
      .insert({ name: input.clientName.trim() })
      .select('id')
      .single()

    clientId = createdClient?.id ?? null
  }

  const { data: sale, error: insertErr } = await supabase
    .from('sales')
    .insert({
      product_id: input.productId,
      client_id: clientId,
      sale_price: input.salePrice,
      sale_date: input.saleDate,
      payment_method: input.paymentMethod,
      notes: input.notes ?? null,
    })
    .select('id, product_id, sale_price, sale_date, payment_method')
    .single()

  if (insertErr || !sale) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'enregistrement de la vente',
    })
  }

  setResponseStatus(event, 201)

  return {
    sale: {
      id: sale.id as string,
      productId: sale.product_id as string,
      salePrice: sale.sale_price as number,
      saleDate: sale.sale_date as string,
      paymentMethod: sale.payment_method as string,
    },
  }
})

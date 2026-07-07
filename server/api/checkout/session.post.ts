import { z } from 'zod'
import type { H3Event } from 'h3'
import {
  FULFILLMENT_METHODS,
  computeShippingCost,
  computeSubtotal,
  computeTotal,
  toStripeAmount,
} from '#shared/utils/checkout'

// ---------------------------------------------------------------------------
// Validation schema — guest checkout (aucun compte)
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  street: z.string().min(3, 'Adresse invalide').max(200),
  postalCode: z.string().min(3, 'Code postal invalide').max(12),
  city: z.string().min(1, 'Ville requise').max(100),
  country: z.string().min(2, 'Pays requis').max(80),
})

const checkoutSchema = z
  .object({
    email: z.string().email('Adresse email invalide'),
    name: z.string().min(2, 'Le nom est requis (min. 2 caractères)').max(120),
    phone: z
      .string()
      .regex(/^[0-9+\s\-()]{7,20}$/, 'Numéro de téléphone invalide')
      .optional()
      .or(z.literal('')),
    fulfillmentMethod: z.enum(FULFILLMENT_METHODS, {
      error: 'Mode de réception invalide',
    }),
    address: addressSchema.optional(),
    productIds: z
      .array(z.string().uuid('Identifiant produit invalide'))
      .min(1, 'Votre panier est vide')
      .max(30, 'Panier trop volumineux'),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillmentMethod === 'shipping' && !value.address) {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Adresse de livraison requise pour une expédition',
      })
    }
  })

// ---------------------------------------------------------------------------
// Event handler — revalidation dispo → order pending + items → session Stripe
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const supabase = getAdminSupabase()
  const body = await readBody(event)

  // ─── Validate input ────────────────────────────────────────────────────────

  const parseResult = checkoutSchema.safeParse(body)
  if (!parseResult.success) {
    const flat = parseResult.error.flatten()
    const firstError
      = Object.values(flat.fieldErrors).flat()[0]
        ?? flat.formErrors[0]
        ?? 'Données invalides'
    throw createError({ statusCode: 422, statusMessage: firstError })
  }

  const input = parseResult.data
  const productIds = [...new Set(input.productIds)]

  // ─── Revalidate availability server-side (pièces uniques, stock 1) ─────────

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price, status, images')
    .in('id', productIds)

  if (productsError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la vérification des articles',
    })
  }

  const foundById = new Map((products ?? []).map(p => [p.id, p]))
  const unavailable: Array<{ id: string, title: string }> = []

  for (const id of productIds) {
    const product = foundById.get(id)
    if (!product) {
      unavailable.push({ id, title: 'Article introuvable' })
    }
    else if (product.status !== 'active') {
      unavailable.push({ id, title: product.title })
    }
  }

  if (unavailable.length > 0) {
    // Aucune session Stripe n'est créée si UN SEUL article n'est plus dispo.
    const titles = unavailable.map(u => u.title).join(', ')
    throw createError({
      statusCode: 409,
      statusMessage: `Article(s) plus disponible(s) : ${titles}`,
      data: { unavailable },
    })
  }

  const orderedProducts = productIds.map(id => foundById.get(id)!)

  // ─── Compute totals (prix DB — jamais ceux envoyés par le client) ──────────

  const lines = orderedProducts.map(p => ({ price: Number(p.price) }))
  const subtotal = computeSubtotal(lines)
  const shippingCost = computeShippingCost(input.fulfillmentMethod)
  const total = computeTotal(subtotal, input.fulfillmentMethod)

  // ─── Create pending order + snapshot items ─────────────────────────────────

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email: input.email,
      customer_name: input.name.trim(),
      phone: input.phone?.trim() || null,
      fulfillment_method: input.fulfillmentMethod,
      shipping_address: input.fulfillmentMethod === 'shipping' ? input.address ?? null : null,
      status: 'pending',
      subtotal,
      shipping_cost: shippingCost,
      total,
      currency: 'eur',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création de la commande',
    })
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      orderedProducts.map(product => ({
        order_id: order.id,
        product_id: product.id,
        title: product.title,
        price: Number(product.price),
        quantity: 1,
      })),
    )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création de la commande',
    })
  }

  // ─── Create Stripe Checkout session (hébergée — redirection) ──────────────

  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const stripe = getStripe()

  const lineItems = orderedProducts.map((product) => {
    const firstImage = product.images?.[0]
    return {
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: toStripeAmount(Number(product.price)),
        product_data: {
          name: product.title,
          // Stripe exige des URLs absolues https pour les visuels
          ...(firstImage && /^https:\/\//.test(firstImage) ? { images: [firstImage] } : {}),
        },
      },
    }
  })

  if (shippingCost > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: toStripeAmount(shippingCost),
        product_data: { name: 'Frais de port' },
      },
    })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: input.email,
      client_reference_id: order.id,
      line_items: lineItems,
      metadata: { order_id: order.id },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
    })

    if (!session.url) {
      throw new Error('Session Stripe sans URL de redirection')
    }

    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    setResponseStatus(event, 201)
    return { url: session.url, orderId: order.id }
  }
  catch {
    // La session n'a pas pu être créée — on ne laisse pas traîner une commande
    // orpheline (les order_items suivent via ON DELETE CASCADE).
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({
      statusCode: 502,
      statusMessage: 'Impossible de démarrer le paiement — réessayez dans quelques instants',
    })
  }
})

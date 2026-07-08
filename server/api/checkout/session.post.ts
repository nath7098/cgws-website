import { z } from 'zod'
import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import {
  SHIPPING_FLAT_RATE,
  computeSubtotal,
  toStripeAmount,
} from '#shared/utils/checkout'

// ---------------------------------------------------------------------------
// Checkout embarqué (E8 rework)
//
// Le formulaire de paiement Stripe est monté DANS la page /checkout. Cette
// route :
//   1. libère l'éventuelle réservation d'une commande précédente abandonnée
//      (l'acheteur ne se bloque pas sur ses propres pièces),
//   2. revalide la disponibilité et RÉSERVE atomiquement chaque produit
//      (active → reserved) pour éviter la double-vente d'une pièce unique,
//   3. crée une commande `pending` (les coordonnées + l'adresse seront
//      collectées par Stripe et rapatriées par le webhook),
//   4. crée une session Checkout `embedded_page` et renvoie son `client_secret`.
//
// Aucun prix ne vient du client : tout est recalculé depuis la base. Les
// moyens de paiement (CB, Apple Pay, Google Pay, Link…) sont pilotés par le
// Dashboard (aucun `payment_method_types` figé). Le mode de réception
// (retrait / livraison) est une `shipping_option` Stripe.
// ---------------------------------------------------------------------------

const RESERVATION_MINUTES = 35 // ≥ 30 min imposé par Stripe pour expires_at

const bodySchema = z.object({
  productIds: z
    .array(z.string().uuid('Identifiant produit invalide'))
    .min(1, 'Votre panier est vide')
    .max(30, 'Panier trop volumineux'),
  previousOrderId: z.string().uuid().optional(),
})

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const supabase = getAdminSupabase()
  const rawBody = await readBody(event)

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstError
      = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Données invalides'
    throw createError({ statusCode: 422, statusMessage: firstError })
  }

  const { productIds: rawIds, previousOrderId } = parsed.data
  const productIds = [...new Set(rawIds)]

  // ─── 0) Libère la réservation d'une commande précédente abandonnée ─────────
  if (previousOrderId) {
    await releaseOrderReservation(previousOrderId)
  }

  // ─── 1) Revalide la disponibilité (pièces uniques, stock 1) ────────────────
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price, status, images')
    .in('id', productIds)

  if (productsError) {
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la vérification des articles' })
  }

  const foundById = new Map((products ?? []).map(p => [p.id, p]))
  const unavailable: Array<{ id: string, title: string }> = []
  for (const id of productIds) {
    const product = foundById.get(id)
    if (!product) unavailable.push({ id, title: 'Article introuvable' })
    else if (product.status !== 'active') unavailable.push({ id, title: product.title })
  }

  if (unavailable.length > 0) {
    const titles = unavailable.map(u => u.title).join(', ')
    throw createError({
      statusCode: 409,
      statusMessage: `Article(s) plus disponible(s) : ${titles}`,
      data: { unavailable },
    })
  }

  const orderedProducts = productIds.map(id => foundById.get(id)!)
  const subtotal = computeSubtotal(orderedProducts.map(p => ({ price: Number(p.price) })))

  // ─── 2) Crée la commande pending (coordonnées remplies par le webhook) ─────
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ status: 'pending', subtotal, currency: 'eur' })
    .select('id')
    .single()

  if (orderError || !order) {
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la création de la commande' })
  }

  // ─── 2bis) Insère les lignes de commande (source pour le fulfillment) ──────
  // Les produits ne sont pas encore réservés à ce stade (le verrou arrive à
  // l'étape 3) : en cas d'échec, un simple delete de la commande suffit — les
  // order_items suivent via ON DELETE CASCADE, aucune réservation à libérer.
  const { error: itemsError } = await supabase.from('order_items').insert(
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
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la création de la commande' })
  }

  // ─── 3) Réserve atomiquement chaque produit (active → reserved) ────────────
  const expiresAtSec = Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60
  const reservedUntil = new Date(expiresAtSec * 1000).toISOString()
  const raceLostTitles: string[] = []

  for (const product of orderedProducts) {
    const { data: locked } = await supabase
      .from('products')
      .update({ status: 'reserved', reserved_until: reservedUntil, reserved_order_id: order.id })
      .eq('id', product.id)
      .eq('status', 'active') // barrière anti double-réservation
      .select('id')

    if (!locked || locked.length === 0) raceLostTitles.push(product.title)
  }

  // Un produit a été réservé/vendu entre la revalidation et le verrou → on
  // annule tout (release cible cette commande) et on refuse la session.
  if (raceLostTitles.length > 0) {
    await releaseOrderReservation(order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({
      statusCode: 409,
      statusMessage: `Article(s) plus disponible(s) : ${raceLostTitles.join(', ')}`,
      data: { unavailable: raceLostTitles.map(title => ({ id: '', title })) },
    })
  }

  // ─── 4) Crée la session Checkout embarquée ─────────────────────────────────
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const stripe = getStripe()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderedProducts.map((product) => {
    const firstImage = product.images?.[0]
    return {
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: toStripeAmount(Number(product.price)),
        product_data: {
          name: product.title,
          ...(firstImage && /^https:\/\//.test(firstImage) ? { images: [firstImage] } : {}),
        },
      },
    }
  })

  // Le choix retrait / livraison est une shipping_option Stripe. Livraison en
  // premier (option par défaut) car c'est le cas majoritaire en ligne.
  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: toStripeAmount(SHIPPING_FLAT_RATE), currency: 'eur' },
        display_name: 'Livraison à domicile',
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 0, currency: 'eur' },
        display_name: 'Retrait à la boutique — Brèches (37)',
      },
    },
  ]

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: lineItems,
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT'],
      },
      shipping_options: shippingOptions,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      expires_at: expiresAtSec,
      return_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    })

    if (!session.client_secret) {
      throw new Error('Session Stripe sans client_secret')
    }

    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    setResponseStatus(event, 201)
    return { clientSecret: session.client_secret, orderId: order.id }
  }
  catch {
    // Session non créée → on ne laisse ni commande orpheline ni pièce verrouillée.
    await releaseOrderReservation(order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({
      statusCode: 502,
      statusMessage: 'Impossible de démarrer le paiement — réessayez dans quelques instants',
    })
  }
})

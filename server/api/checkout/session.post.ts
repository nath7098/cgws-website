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
//   2. revalide la disponibilité et RÉSERVE atomiquement la quantité demandée
//      par produit, unité par unité (RPC `reserve_product_unit` : stock - 1 à
//      chaque appel ; le produit ne passe `reserved` que sur la toute
//      dernière unité) pour éviter la double-vente,
//   3. crée une commande `pending` (les coordonnées + l'adresse seront
//      collectées par Stripe et rapatriées par le webhook),
//   4. crée une session Checkout `embedded_page` et renvoie son `client_secret`.
//
// Aucun prix ne vient du client : tout est recalculé depuis la base. Les
// moyens de paiement (CB, Apple Pay, Google Pay, Link…) sont pilotés par le
// Dashboard (aucun `payment_method_types` figé). Le mode de réception
// (retrait / livraison) est une `shipping_option` Stripe.
//
// Achat multiple (US-096) : le payload est désormais un tableau
// `{ productId, quantity }[]` — la RPC `reserve_product_unit` reste appelée
// UNE fois par UNITÉ demandée (aucune nouvelle fonction SQL, elle décrémente
// déjà `stock` d'une unité par appel et ne verrouille `status='reserved'` que
// sur la toute dernière unité).
// ---------------------------------------------------------------------------

const RESERVATION_MINUTES = 35 // ≥ 30 min imposé par Stripe pour expires_at

// Quantité max par ligne alignée sur `QuantitySelector` (1..min(stock, 10)) —
// borne défensive côté serveur, indépendante de ce que le client a pu forcer.
const MAX_QUANTITY_PER_LINE = 10
// Le panier CGWS reste un panier de niche (pièces d'équitation, pas un
// supermarché) : 30 UNITÉS au total (et non 30 lignes distinctes comme avant
// l'US-096) est un plafond généreux pour un usage légitime tout en bornant le
// coût d'une boucle de réservation séquentielle (30 appels RPC max par
// tentative de paiement) et le risque d'abus/DoS applicatif.
const MAX_TOTAL_QUANTITY = 30

const bodySchema = z.object({
  items: z
    .array(z.object({
      productId: z.string().uuid('Identifiant produit invalide'),
      quantity: z.number().int('Quantité invalide').min(1, 'Quantité invalide').max(MAX_QUANTITY_PER_LINE, `Quantité maximale : ${MAX_QUANTITY_PER_LINE} par article`),
    }))
    .min(1, 'Votre panier est vide')
    .max(MAX_TOTAL_QUANTITY, 'Panier trop volumineux')
    .refine(
      items => items.reduce((sum, item) => sum + item.quantity, 0) <= MAX_TOTAL_QUANTITY,
      { message: 'Panier trop volumineux' },
    ),
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

  const { items: rawItems, previousOrderId } = parsed.data

  // Dé-duplication par productId : si le client envoie deux fois la même
  // ligne (ne devrait jamais arriver — le panier CGWS garantit 1 ligne par
  // produit — mais un payload forgé/rejoué reste possible), on additionne les
  // quantités plutôt que d'ignorer silencieusement les doublons.
  const quantityByProductId = new Map<string, number>()
  for (const item of rawItems) {
    quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + item.quantity)
  }
  const productIds = [...quantityByProductId.keys()]

  // ─── 0) Libère la réservation d'une commande précédente abandonnée ─────────
  if (previousOrderId) {
    await releaseOrderReservation(previousOrderId)
  }

  // ─── 1) Revalide la disponibilité (status actif ET stock ≥ quantité demandée) ─
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price, status, stock, images')
    .in('id', productIds)

  if (productsError) {
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la vérification des articles' })
  }

  const foundById = new Map((products ?? []).map(p => [p.id, p]))
  const unavailable: Array<{ id: string, title: string }> = []
  for (const id of productIds) {
    const product = foundById.get(id)
    const quantity = quantityByProductId.get(id)!
    if (!product) unavailable.push({ id, title: 'Article introuvable' })
    // `stock ?? 0` : cohérent avec la barrière `stock >= 1` de la RPC — un
    // stock NULL est invendable en ligne plutôt que survendu. Comparé à la
    // quantité demandée (US-096) et non plus systématiquement à 1.
    else if (product.status !== 'active' || (product.stock ?? 0) < quantity) unavailable.push({ id, title: product.title })
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
  const subtotal = computeSubtotal(
    orderedProducts.map(p => ({ price: Number(p.price), quantity: quantityByProductId.get(p.id)! })),
  )

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
      quantity: quantityByProductId.get(product.id)!,
    })),
  )
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({ statusCode: 500, statusMessage: 'Erreur lors de la création de la commande' })
  }

  // ─── 3) Réserve atomiquement `quantity` unités de stock par produit ───────
  // RPC `reserve_product_unit` (migration 006) : `stock = stock - 1` sous la
  // barrière `status = 'active' AND stock >= 1`. Le produit ne passe
  // `reserved` (+ verrou reserved_order_id) que si c'était la dernière unité —
  // un multi-stock reste `active` et achetable par d'autres. Achat multiple
  // (US-096) : on rappelle la RPC `quantity` fois PAR PRODUIT (séquentiel,
  // chaque appel restant atomique côté SQL) — aucune nouvelle fonction SQL.
  const expiresAtSec = Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60
  const reservedUntil = new Date(expiresAtSec * 1000).toISOString()
  // Unités RÉELLEMENT réservées par produit pour CETTE tentative — nécessaire
  // au rollback ciblé (peut être < quantity demandée si la course est perdue
  // en cours de route sur ce produit).
  const reservedUnitsByProduct = new Map<string, number>()
  const raceLostDetails: Array<{ title: string, available: number, requested: number }> = []

  for (const product of orderedProducts) {
    const quantity = quantityByProductId.get(product.id)!
    let reservedCount = 0

    for (let i = 0; i < quantity; i++) {
      const { data: reserved } = await supabase.rpc('reserve_product_unit', {
        p_product_id: product.id,
        p_order_id: order.id,
        p_reserved_until: reservedUntil,
      })

      // Succès = la RPC retourne une ligne (new_stock). 0 ligne = course
      // perdue (stock épuisé pour ce produit entre la revalidation et le
      // verrou) — inutile de continuer à tenter les unités suivantes de ce
      // même produit, le stock est à 0.
      if (reserved && reserved.length > 0) reservedCount++
      else break
    }

    if (reservedCount > 0) reservedUnitsByProduct.set(product.id, reservedCount)
    if (reservedCount < quantity) {
      raceLostDetails.push({ title: product.title, available: reservedCount, requested: quantity })
    }
  }

  // Course perdue sur au moins un produit → rollback CIBLÉ : on restitue
  // TOUTES les unités effectivement réservées pour cette tentative, pour CE
  // produit ET pour les AUTRES produits du panier (`releaseOrderReservation`
  // n'est pas réutilisable ici : elle lirait les order_items et
  // ré-incrémenterait des unités jamais réservées puisque la commande n'a pas
  // encore été validée par la barrière pending→cancelled), puis on supprime
  // la commande et on refuse la session — le message indique la quantité
  // réellement disponible par article concerné.
  if (raceLostDetails.length > 0) {
    for (const [productId, count] of reservedUnitsByProduct) {
      for (let i = 0; i < count; i++) {
        await supabase.rpc('release_product_unit', { p_product_id: productId, p_order_id: order.id })
      }
    }
    await supabase.from('orders').delete().eq('id', order.id)

    const details = raceLostDetails
      .map(d => `${d.title} (${d.available} disponible${d.available > 1 ? 's' : ''} sur ${d.requested} demandé${d.requested > 1 ? 's' : ''})`)
      .join(', ')
    throw createError({
      statusCode: 409,
      statusMessage: `Article(s) plus disponible(s) dans la quantité demandée : ${details}`,
      data: { unavailable: raceLostDetails.map(d => ({ id: '', title: d.title })) },
    })
  }

  // ─── 4) Crée la session Checkout embarquée ─────────────────────────────────
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const stripe = getStripe()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderedProducts.map((product) => {
    const firstImage = product.images?.[0]
    return {
      quantity: quantityByProductId.get(product.id)!,
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

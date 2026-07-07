import type Stripe from 'stripe'
import type { H3Event } from 'h3'
import type { FulfillmentMethod } from '#shared/utils/checkout'
import type { ShippingAddress } from '~/types'
import {
  sendConsignmentSaleEmail,
  sendOrderConfirmationEmail,
} from '~~/server/services/email'

/**
 * Webhook Stripe — `checkout.session.completed` confirme la commande :
 * order → paid, produits → sold (+ product_status_history), ligne `sales`
 * (payment_method 'card') pour le CA admin, emails non-bloquants.
 *
 * SÉCURITÉ : la signature est vérifiée sur le CORPS BRUT de la requête
 * (`readRawBody`) via `stripe.webhooks.constructEvent` — ne jamais parser le
 * body avant vérification, un JSON re-sérialisé invaliderait la signature.
 *
 * IDEMPOTENCE : Stripe peut rejouer un événement. La transition pending→paid
 * est un update conditionnel (`eq('status', 'pending')`) filtré sur le
 * `stripe_session_id` : un rejeu ne matche aucune ligne et sort immédiatement,
 * donc jamais de double vente ni de double passage à 'sold'.
 */
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const webhookSecret = (config.stripeWebhookSecret as string | undefined)?.trim()

  if (!webhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook Stripe non configuré',
    })
  }

  const signature = getHeader(event, 'stripe-signature')
  const rawBody = await readRawBody(event, false)

  if (!signature || !rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Requête webhook invalide' })
  }

  const stripe = getStripe()

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Signature Stripe invalide' })
  }

  // ─── Session expirée → commande annulée (panier de l'acheteur intact) ──────

  if (stripeEvent.type === 'checkout.session.expired') {
    const session = stripeEvent.data.object
    const supabase = getAdminSupabase()
    await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id)
      .eq('status', 'pending')
    return { received: true }
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { received: true }
  }

  // ─── checkout.session.completed ─────────────────────────────────────────────

  const session = stripeEvent.data.object
  const orderId = session.metadata?.order_id ?? session.client_reference_id

  if (!orderId) {
    // Session sans commande CGWS associée — on acquitte sans traiter.
    return { received: true }
  }

  const supabase = getAdminSupabase()

  const paymentIntent
    = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Barrière d'idempotence atomique : seul UN appel peut faire pending → paid.
  const { data: updatedOrders } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent: paymentIntent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')
    .select('id, email, customer_name, fulfillment_method, shipping_address, subtotal, shipping_cost, total')

  const order = updatedOrders?.[0]
  if (!order) {
    // Déjà traitée (rejeu Stripe) ou commande inconnue — acquitter sans effet.
    return { received: true }
  }

  // ─── Marquer chaque produit vendu + créer les ventes ───────────────────────

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_id, title, price')
    .eq('order_id', orderId)

  const saleDate = new Date().toISOString().slice(0, 10)
  const apiKey = config.resendApiKey as string | undefined

  for (const item of orderItems ?? []) {
    if (!item.product_id) continue

    const { data: product } = await supabase
      .from('products')
      .select('id, title, status, is_consignment, consignment_id')
      .eq('id', item.product_id)
      .single()

    if (!product) continue

    // ── Commission consignation (modèle admin/sales) : salePrice − agreedPrice ──

    let commissionAmount: number | null = null
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
        if (consignment.agreed_price !== null) {
          commissionAmount = Number(item.price) - Number(consignment.agreed_price)
        }
      }
    }

    // ── Ligne de vente (CA admin/reporting — payment_method 'card') ──

    await supabase.from('sales').insert({
      product_id: item.product_id,
      client_id: null,
      sale_price: Number(item.price),
      sale_date: saleDate,
      payment_method: 'card',
      commission_amount: commissionAmount,
      notes: `Vente en ligne — commande ${orderId}`,
    })

    // ── Produit → sold + historique de statut ──

    if (product.status !== 'sold') {
      await supabase
        .from('products')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', item.product_id)

      await supabase.from('product_status_history').insert({
        product_id: item.product_id,
        old_status: product.status ?? 'active',
        new_status: 'sold',
        changed_by: 'stripe-webhook',
      })
    }

    // ── Email déposant si consignation (non-bloquant) ──

    if (consignmentData && apiKey) {
      sendConsignmentSaleEmail(apiKey, {
        depositorName: consignmentData.depositor_name,
        depositorEmail: consignmentData.depositor_email,
        itemDescription: consignmentData.item_description,
        salePrice: Number(item.price),
        commissionAmount,
        agreedPrice: consignmentData.agreed_price !== null ? Number(consignmentData.agreed_price) : null,
        consignmentId: consignmentData.id,
      }).catch(() => {
        // Non-bloquant — l'échec d'email n'affecte pas la confirmation
      })
    }
  }

  // ─── Email de confirmation acheteur (non-bloquant) ─────────────────────────

  if (apiKey) {
    sendOrderConfirmationEmail(apiKey, {
      customerName: order.customer_name,
      customerEmail: order.email,
      orderId: order.id,
      items: (orderItems ?? []).map(item => ({
        title: item.title,
        price: Number(item.price),
        quantity: 1,
      })),
      subtotal: Number(order.subtotal ?? 0),
      shippingCost: Number(order.shipping_cost ?? 0),
      total: Number(order.total ?? 0),
      fulfillmentMethod: order.fulfillment_method as FulfillmentMethod,
      shippingAddress: (order.shipping_address as ShippingAddress | null) ?? undefined,
    }).catch(() => {
      // Non-bloquant — l'échec d'email n'affecte pas la confirmation
    })
  }

  return { received: true }
})

import type Stripe from 'stripe'
import type { H3Event } from 'h3'

/**
 * Webhook Stripe (E8 rework) — délègue au fulfillment partagé
 * (`server/utils/fulfillment.ts`), lui-même appelé aussi par la landing page.
 *
 * SÉCURITÉ : la signature est vérifiée sur le CORPS BRUT (`readRawBody`) via
 * `stripe.webhooks.constructEvent` — ne jamais parser le body avant, un JSON
 * re-sérialisé invaliderait la signature.
 *
 * Événements traités :
 *   - checkout.session.completed / async_payment_succeeded → fulfillment
 *     (idempotent : pending → paid, produits → sold, ventes, emails).
 *   - checkout.session.async_payment_failed / expired → libère la réservation
 *     et annule la commande (les pièces redeviennent disponibles).
 */
export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const webhookSecret = (config.stripeWebhookSecret as string | undefined)?.trim()

  if (!webhookSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Webhook Stripe non configuré' })
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

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      await fulfillCheckoutSession(stripeEvent.data.object)
      break
    }
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      const session = stripeEvent.data.object
      const orderId = session.metadata?.order_id ?? session.client_reference_id
      if (orderId) await releaseOrderReservation(orderId)
      break
    }
    default:
      // Événement non pertinent — on acquitte sans traiter.
      break
  }

  return { received: true }
})

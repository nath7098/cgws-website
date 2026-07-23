import type { H3Event } from 'h3'
import type { FulfillmentMethod, OrderStatus } from '#shared/utils/checkout'
import type { CheckoutSessionStatus, OrderRecap, ShippingAddress } from '~/types'

/**
 * Statut d'une session Checkout pour la page de retour (/checkout/success).
 *
 * Récupère la session auprès de Stripe (source de vérité immédiate du statut,
 * le webhook pouvant avoir quelques secondes de retard) et déclenche le
 * fulfillment côté landing page (idempotent) — conformément à la reco Stripe
 * « déclenchez le fulfillment depuis le webhook ET la landing page ».
 *
 * Sécurité : accès par identifiant de session Stripe non-devinable (`cs_...`),
 * comme un lien de confirmation. Réponse volontairement restreinte (OrderRecap :
 * ni payment_intent, ni client_id, ni téléphone).
 */
export default defineEventHandler(async (event: H3Event): Promise<CheckoutSessionStatus> => {
  const sessionId = getQuery(event).session_id

  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant de session invalide' })
  }

  const stripe = getStripe()

  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  }
  catch {
    throw createError({ statusCode: 404, statusMessage: 'Session introuvable' })
  }

  // Fulfillment immédiat si le paiement est passé (idempotent : n'a aucun effet
  // si le webhook a déjà confirmé la commande).
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
    await fulfillCheckoutSession(session)
  }

  // Récapitulatif depuis la base (reflète l'état après fulfillment éventuel).
  const supabase = getAdminSupabase()
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, email, customer_name, fulfillment_method, shipping_address, subtotal, shipping_cost, total, created_at')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  let recap: OrderRecap | null = null
  if (order) {
    const { data: items } = await supabase
      .from('order_items')
      .select('title, price, quantity')
      .eq('order_id', order.id)

    recap = {
      id: order.id,
      status: order.status as OrderStatus,
      customerName: order.customer_name,
      email: order.email,
      fulfillmentMethod: (order.fulfillment_method as FulfillmentMethod | null) ?? null,
      shippingAddress: (order.shipping_address as ShippingAddress | null) ?? null,
      subtotal: Number(order.subtotal ?? 0),
      shippingCost: Number(order.shipping_cost ?? 0),
      total: Number(order.total ?? 0),
      items: (items ?? []).map(item => ({
        title: item.title,
        price: Number(item.price),
        quantity: item.quantity ?? 1,
      })),
      createdAt: order.created_at ?? '',
    }
  }

  return {
    status: session.status as CheckoutSessionStatus['status'],
    paymentStatus: session.payment_status as CheckoutSessionStatus['paymentStatus'],
    order: recap,
  }
})

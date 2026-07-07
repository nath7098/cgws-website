import type { H3Event } from 'h3'
import type { FulfillmentMethod, OrderStatus } from '#shared/utils/checkout'
import type { OrderRecap, ShippingAddress } from '~/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Récapitulatif d'une commande pour la page /checkout/success.
 *
 * Accessible par UUID de commande ou par `stripe_session_id` (`cs_...`).
 * Sécurité : pas d'auth — comme un lien de confirmation classique, l'accès
 * repose sur le caractère non-devinable de l'identifiant (UUID v4 / session
 * Stripe). La réponse est volontairement restreinte (OrderRecap) : jamais de
 * payment_intent, de client_id ni de téléphone.
 */
export default defineEventHandler(async (event: H3Event): Promise<{ order: OrderRecap }> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant' })
  }

  const bySession = id.startsWith('cs_')
  if (!bySession && !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const supabase = getAdminSupabase()

  const query = supabase
    .from('orders')
    .select('id, status, email, customer_name, fulfillment_method, shipping_address, subtotal, shipping_cost, total, created_at')

  const { data: order } = bySession
    ? await query.eq('stripe_session_id', id).maybeSingle()
    : await query.eq('id', id).maybeSingle()

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('title, price, quantity')
    .eq('order_id', order.id)

  return {
    order: {
      id: order.id,
      status: order.status as OrderStatus,
      customerName: order.customer_name,
      email: order.email,
      fulfillmentMethod: order.fulfillment_method as FulfillmentMethod,
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
    },
  }
})

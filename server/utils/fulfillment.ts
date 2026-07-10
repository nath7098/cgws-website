import type Stripe from 'stripe'
import type { FulfillmentMethod } from '#shared/utils/checkout'
import type { ShippingAddress } from '~/types'
import {
  sendConsignmentSaleEmail,
  sendOrderConfirmationEmail,
} from '~~/server/services/email'

/**
 * Fulfillment partagé du Checkout embarqué (E8 rework).
 *
 * Ce module est la SOURCE DE VÉRITÉ unique de la confirmation d'une commande.
 * Il est appelé à la fois par le webhook Stripe (`checkout.session.completed`
 * / `async_payment_succeeded`) ET par la page de retour (`session-status`),
 * conformément à la recommandation Stripe « déclenchez le fulfillment depuis le
 * webhook ET depuis la landing page ». L'idempotence garantit qu'un même
 * paiement n'est jamais traité deux fois même en cas d'appels concurrents.
 */

/** ISO 3166-1 alpha-2 → libellé FR pour les pays les plus courants (affichage). */
const COUNTRY_LABELS: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
  DE: 'Allemagne',
  ES: 'Espagne',
  IT: 'Italie',
}

function mapStripeAddress(address: Stripe.Address | null | undefined): ShippingAddress | null {
  if (!address) return null
  const street = [address.line1, address.line2].filter(Boolean).join(', ')
  return {
    street,
    postalCode: address.postal_code ?? '',
    city: address.city ?? '',
    country: address.country ? COUNTRY_LABELS[address.country] ?? address.country : '',
  }
}

/**
 * Confirme une commande à partir d'une session Stripe payée. Idempotent :
 * la transition `pending → paid` est un update conditionnel filtré sur
 * `status = 'pending'` ; un second appel (rejeu webhook OU landing page) ne
 * matche aucune ligne et sort sans effet.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  // Seuls les paiements réellement encaissés déclenchent le fulfillment.
  // (`no_payment_required` couvre le cas théorique d'un total à 0.)
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return
  }

  const orderId = session.metadata?.order_id ?? session.client_reference_id
  if (!orderId) return

  const config = useRuntimeConfig()
  const supabase = getAdminSupabase()

  const paymentIntent
    = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  // Le mode de réception est déterminé par l'option de livraison choisie dans
  // Stripe : coût > 0 ⇒ livraison, coût 0 ⇒ retrait boutique.
  const shippingAmount = session.shipping_cost?.amount_total ?? 0
  const fulfillmentMethod: FulfillmentMethod = shippingAmount > 0 ? 'shipping' : 'pickup'

  const shippingAddress
    = fulfillmentMethod === 'shipping'
      ? mapStripeAddress(session.collected_information?.shipping_details?.address)
      : null

  const details = session.customer_details
  const subtotal = (session.amount_subtotal ?? 0) / 100
  const shippingCost = shippingAmount / 100
  const total = (session.amount_total ?? 0) / 100

  // ─── Barrière d'idempotence atomique : seul UN appel fait pending → paid ────
  const { data: updatedOrders } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      email: details?.email ?? null,
      customer_name: details?.name ?? null,
      phone: details?.phone ?? null,
      fulfillment_method: fulfillmentMethod,
      shipping_address: shippingAddress,
      subtotal,
      shipping_cost: shippingCost,
      total,
      stripe_payment_intent: paymentIntent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')
    .select('id, email, customer_name, fulfillment_method, shipping_address, subtotal, shipping_cost, total')

  const order = updatedOrders?.[0]
  if (!order) {
    // Déjà traitée (rejeu / double déclenchement) ou commande inconnue.
    return
  }

  // ─── Marquer chaque produit vendu + créer les ventes (CA admin) ────────────
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
      .select('id, title, is_consignment, consignment_id')
      .eq('id', item.product_id)
      .single()

    if (!product) continue

    // Commission consignation (modèle admin/sales) : salePrice − agreedPrice.
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

    await supabase.from('sales').insert({
      product_id: item.product_id,
      client_id: null,
      sale_price: Number(item.price),
      sale_date: saleDate,
      payment_method: 'card',
      commission_amount: commissionAmount,
      notes: `Vente en ligne — commande ${orderId}`,
    })

    // Le stock a DÉJÀ été décrémenté à la réservation (RPC reserve_product_unit,
    // création de session) — on n'y touche plus ici. Le produit ne passe `sold`
    // que si CETTE commande détenait le verrou de dernière unité (update
    // conditionnel status='reserved' AND reserved_order_id=orderId). Un produit
    // multi-stock encore en vente (resté 'active'), ou verrouillé par une autre
    // commande, n'est pas touché.
    const { data: soldProducts } = await supabase
      .from('products')
      .update({
        status: 'sold',
        reserved_until: null,
        reserved_order_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.product_id)
      .eq('status', 'reserved')
      .eq('reserved_order_id', orderId)
      .select('id')

    if (soldProducts && soldProducts.length > 0) {
      await supabase.from('product_status_history').insert({
        product_id: item.product_id,
        old_status: 'reserved',
        new_status: 'sold',
        changed_by: 'stripe-webhook',
      })
    }

    if (consignmentData && apiKey) {
      // Awaité impérativement : en serverless (Vercel), un fire-and-forget est
      // gelé/tué dès que la réponse part — l'email n'est jamais envoyé.
      try {
        await sendConsignmentSaleEmail(apiKey, {
          depositorName: consignmentData.depositor_name,
          depositorEmail: consignmentData.depositor_email,
          itemDescription: consignmentData.item_description,
          salePrice: Number(item.price),
          commissionAmount,
          agreedPrice: consignmentData.agreed_price !== null ? Number(consignmentData.agreed_price) : null,
          consignmentId: consignmentData.id,
        })
      }
      catch {
        // Non-bloquant : l'échec d'email n'affecte pas la confirmation.
      }
    }
  }

  // ─── Email de confirmation acheteur (non-bloquant mais AWAITÉ) ─────────────
  // En serverless (Vercel), un fire-and-forget est gelé/tué dès que la réponse
  // part — l'email n'est jamais envoyé. On await, le try/catch conserve la
  // sémantique non-bloquante.
  if (apiKey && order.email) {
    try {
      await sendOrderConfirmationEmail(apiKey, {
        customerName: order.customer_name ?? '',
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
      })
    }
    catch {
      // Non-bloquant : l'échec d'email n'affecte pas la confirmation.
    }
  }
}

/**
 * Libère la réservation d'une commande abandonnée / expirée / échouée :
 * restitue UNE unité de stock par ligne de commande (RPC `release_product_unit`)
 * et passe la commande en `cancelled`.
 *
 * Idempotent par la transition de commande : seule la transition
 * `pending → cancelled` (update conditionnel) donne le droit de restituer le
 * stock. Un release rejoué (webhook `expired` + retour panier, double appel…)
 * ne matche aucune ligne et ne double-incrémente JAMAIS ; une commande déjà
 * payée n'est pas touchée. Côté produit, la RPC ne déverrouille le statut que
 * si CETTE commande détenait le verrou de dernière unité — une réservation
 * manuelle admin (reserved_order_id ≠ order) n'est jamais réactivée.
 */
export async function releaseOrderReservation(orderId: string): Promise<void> {
  const supabase = getAdminSupabase()

  // ─── 1) Barrière d'idempotence : pending → cancelled, ou rien ──────────────
  const { data: cancelled } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')

  if (!cancelled || cancelled.length === 0) return

  // ─── 2) Restitue une unité de stock par ligne de commande ──────────────────
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    if (!item.product_id) continue
    await supabase.rpc('release_product_unit', {
      p_product_id: item.product_id,
      p_order_id: orderId,
    })
  }
}

import type Stripe from 'stripe'
import type { FulfillmentMethod } from '#shared/utils/checkout'
import type { ShippingAddress } from '~/types'
import {
  sendConsignmentSaleEmail,
  sendOrderConfirmationEmail,
} from '~~/server/services/email'
import { captureOrderPaid } from '~~/server/services/analytics'

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
    .select('product_id, title, price, quantity')
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

    // Achat multiple (US-096) : `order_items.price` est le prix UNITAIRE (celui
    // affiché au client, celui utilisé pour la commission déposant) — le CA
    // enregistré côté admin (`sales.sale_price`, sommé tel quel par
    // `RevenueChart`/`revenue-monthly.get.ts`) doit lui refléter le TOTAL de la
    // ligne. Une pièce de consignation reste toujours quantity=1 par
    // construction (pièce unique, cf. `showQuantitySelector`/`QuantitySelector`
    // jamais affichés pour `isConsignment=true`) : `unitPrice * quantity` y est
    // donc strictement égal à `unitPrice`, ce correctif ne change ni son
    // `sale_price` ni son `commissionAmount` (calculée sur le prix UNITAIRE,
    // jamais sur le total — une commission de dépôt-vente est par nature liée
    // à l'exemplaire unique vendu, pas à une notion de quantité qui n'existe
    // pas pour ces pièces).
    //
    // Décision produit (une seule ligne `sales` par ligne de commande, au prix
    // TOTAL, plutôt que N lignes au prix unitaire) : `sales` n'a pas de colonne
    // `quantity` et `product_id` n'y est pas contraint UNIQUE — north-star
    // resterait migrable, mais le modèle existant (saisie manuelle via
    // `SaleForm.vue`, `admin/ventes/index.vue`) traite déjà "1 ligne `sales` =
    // 1 événement de vente", jamais "1 ligne = 1 unité physique". Créer N
    // lignes identiques (même produit, même commande, même date) pour un achat
    // de 3 bidons d'huile ferait apparaître 3 "ventes" distinctes dans la liste
    // admin et fausserait tout comptage du NOMBRE de transactions — alors
    // qu'une seule ligne au prix total préserve cette sémantique sans aucun
    // changement de schéma ni de la lecture du dashboard (`sale_price` sommé
    // reste exact par construction).
    const quantity = item.quantity ?? 1
    const totalSalePrice = Number(item.price) * quantity

    // Commission consignation (modèle admin/sales) : salePrice − agreedPrice.
    // Basée sur le prix UNITAIRE (toujours == au total pour une consignation,
    // quantity=1) — inchangée par cette correction.
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
      sale_price: totalSalePrice,
      sale_date: saleDate,
      payment_method: 'card',
      commission_amount: commissionAmount,
      notes: quantity > 1
        ? `Vente en ligne — commande ${orderId} (${quantity} exemplaires)`
        : `Vente en ligne — commande ${orderId}`,
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
      .select('id, stock')

    if (soldProducts && soldProducts.length > 0) {
      await supabase.from('product_status_history').insert({
        product_id: item.product_id,
        old_status: 'reserved',
        new_status: 'sold',
        changed_by: 'stripe-webhook',
      })

      // Edge case connu et acté non-bloquant (dette US-091, Gherkin 6 US-096) :
      // un `release_product_unit` concurrent pendant qu'une autre commande
      // détient le verrou dernière-unité, suivi du paiement de cette dernière,
      // peut faire passer le produit `sold` avec un `stock` résiduel > 0
      // (l'atomicité SQL sous-jacente n'est PAS corrigée ici, hors périmètre —
      // seule l'invisibilité opérationnelle l'est). Log distinctif pour que
      // Camille/Nathan repèrent et réactivent le produit rapidement en admin.
      const residualStock = soldProducts[0]?.stock ?? 0
      if (residualStock > 0) {
        console.error(
          `[stock-anomaly] Produit ${item.product_id} ("${item.title}") passé "sold" avec un stock résiduel `
          + `de ${residualStock} (commande ${orderId}). Vérifier/réactiver le produit en admin si ce stock `
          + `résiduel est légitime — cause connue : release concurrent pendant le verrou dernière-unité (dette actée US-091).`,
        )
      }
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
        // `item.quantity` vient de la même sélection `order_items` que le
        // correctif CA admin ci-dessus (US-096) — un `1` figé ici affichait
        // "quantité 1" dans l'email même pour un achat multiple réel.
        items: (orderItems ?? []).map(item => ({
          title: item.title,
          price: Number(item.price),
          quantity: item.quantity ?? 1,
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

  // ─── Analytics serveur order_paid (US-104) — DERNIÈRE étape, jamais avant ──
  // Placé ici (et non dans le webhook) : cette branche ne s'exécute que si CE
  // appel a gagné la barrière d'idempotence pending → paid — l'événement est
  // donc capturé EXACTEMENT une fois par commande payée, que le fulfillment
  // ait été déclenché par le webhook Stripe OU par la landing page (les deux
  // appellent ce module), et jamais sur un rejeu. Un échec de capture est
  // avalé par contrat (captureOrderPaid ne lève jamais) — le try/catch est
  // une ceinture supplémentaire.
  try {
    await captureOrderPaid({
      analyticsId: session.metadata?.analytics_id ?? null,
      amountTotal: total,
      currency: session.currency ?? 'eur',
      itemsCount: (orderItems ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      paymentMethodType: session.payment_method_types?.[0] ?? null,
    })
  }
  catch {
    // Non-bloquant : l'échec d'analytics n'affecte pas la confirmation.
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

  // ─── 2) Restitue `quantity` unités de stock par ligne de commande (US-096) ──
  // Chaque ligne peut représenter plusieurs unités réservées (achat multiple) :
  // on rappelle `release_product_unit` `quantity` fois, symétrique de la
  // boucle de réservation `quantity` fois côté session.post.ts.
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  for (const item of items ?? []) {
    if (!item.product_id) continue
    const quantity = item.quantity ?? 1
    for (let i = 0; i < quantity; i++) {
      await supabase.rpc('release_product_unit', {
        p_product_id: item.product_id,
        p_order_id: orderId,
      })
    }
  }
}

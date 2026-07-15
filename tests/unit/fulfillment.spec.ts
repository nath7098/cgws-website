/**
 * US-091 — Tests unitaires du chemin de paiement : fulfillment, réservation,
 * routage webhook.
 *
 * ⚠️ Portée explicitement EXCLUE (voir docs/SPRINT_PLAN.md § US-091) :
 * l'atomicité SQL réelle des fonctions Postgres `reserve_product_unit` /
 * `release_product_unit` (migration 006) — non testable en unitaire avec des
 * mocks, elle relève de la recette e2e contre une vraie base. Ce fichier
 * couvre l'ORCHESTRATION serveur (server/utils/fulfillment.ts +
 * server/api/checkout/webhook.post.ts) : appels, ordre des opérations,
 * idempotence applicative, rollback ciblé, routage des événements webhook —
 * via un fake Supabase en mémoire (tests/unit/helpers/fakeSupabase.ts) qui
 * reproduit la SÉMANTIQUE des barrières conditionnelles documentées dans le
 * code, jamais leur atomicité concurrente réelle.
 *
 * Aucun appel réseau : Supabase, Stripe et Resend sont intégralement mockés.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import type { Mock } from 'vitest'
import type { Tables } from '~/types/database.types'
import { sendConsignmentSaleEmail, sendOrderConfirmationEmail } from '~~/server/services/email'
import { fulfillCheckoutSession, releaseOrderReservation } from '../../server/utils/fulfillment'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

// `vi.mock` est hoisté par Vitest au-dessus de TOUS les imports du module
// (y compris ceux ci-dessus), quel que soit son emplacement textuel dans le
// fichier — il est néanmoins placé après les imports pour satisfaire la règle
// ESLint `import/first`.
vi.mock('~~/server/services/email', () => ({
  sendConsignmentSaleEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

// ─── Fixtures ──────────────────────────────────────────────────────────────

const ORDER_ID = '00000000-0000-4000-8000-000000000001'
const PRODUCT_ID = '00000000-0000-4000-8000-000000000002'
const SESSION_ID = 'cs_test_123'

function makeOrderRow(overrides: Partial<Tables<'orders'>> = {}): Tables<'orders'> {
  return {
    id: ORDER_ID,
    email: null,
    customer_name: null,
    phone: null,
    fulfillment_method: null,
    shipping_address: null,
    status: 'pending',
    subtotal: 1850,
    shipping_cost: null,
    total: null,
    currency: 'eur',
    stripe_session_id: SESSION_ID,
    stripe_payment_intent: null,
    client_id: null,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeOrderItemRow(overrides: Partial<Tables<'order_items'>> = {}): Tables<'order_items'> {
  return {
    id: '00000000-0000-4000-8000-000000000003',
    order_id: ORDER_ID,
    product_id: PRODUCT_ID,
    title: 'Selle western Billy Cook 16"',
    price: 1850,
    quantity: 1,
    created_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeProductRow(overrides: Partial<Tables<'products'>> = {}): Tables<'products'> {
  return {
    id: PRODUCT_ID,
    slug: 'selle-western-billy-cook',
    title: 'Selle western Billy Cook 16"',
    description: 'Selle de reining en excellent état',
    price: 1850,
    category: 'selles',
    brand: 'Billy Cook',
    size: '16"',
    condition: 'excellent',
    is_consignment: false,
    consignment_id: null,
    status: 'reserved',
    reserved_order_id: ORDER_ID,
    reserved_until: '2026-07-01T01:00:00.000Z',
    images: [],
    stock: 0,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeConsignmentRow(overrides: Partial<Tables<'consignments'>> = {}): Tables<'consignments'> {
  return {
    id: '00000000-0000-4000-8000-000000000004',
    depositor_name: 'Camille Testeur',
    depositor_email: 'depositor@example.com',
    depositor_phone: null,
    item_description: 'Selle western Billy Cook 16"',
    brand: 'Billy Cook',
    condition: 'excellent',
    asking_price: 1850,
    agreed_price: 1500,
    images: [],
    status: 'accepted',
    notes: null,
    created_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

/**
 * `overrides` est volontairement large (`Record<string, unknown>` plutôt que
 * `Partial<Stripe.Checkout.Session>`) : le SDK Stripe type `shipping_cost`,
 * `customer_details`, etc. avec bien plus de champs que ceux réellement
 * exploités par `fulfillCheckoutSession`. Un `Partial<...>` obligerait chaque
 * appelant de test à fournir des objets complets ; le cast final unique
 * (`as unknown as Stripe.Checkout.Session`) suffit, la fixture ne servant
 * qu'aux champs effectivement lus par le code testé.
 */
function makeSession(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  const base = {
    id: SESSION_ID,
    payment_status: 'paid',
    metadata: { order_id: ORDER_ID },
    client_reference_id: ORDER_ID,
    payment_intent: 'pi_test_123',
    shipping_cost: { amount_total: 0 },
    collected_information: null,
    customer_details: { email: 'buyer@example.com', name: 'Jean Dupont', phone: '0600000000' },
    amount_subtotal: 185000,
    amount_total: 185000,
    ...overrides,
  }
  return base as unknown as Stripe.Checkout.Session
}

// ─── fulfillCheckoutSession ────────────────────────────────────────────────

describe('fulfillCheckoutSession', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase

  beforeEach(() => {
    globals = stubServerGlobals()
    globals.config = { resendApiKey: 'test_resend_key', public: { siteUrl: 'https://cgws.fr' } }
    supabase = new FakeSupabase()
    globals.supabase = supabase
    vi.mocked(sendOrderConfirmationEmail).mockClear()
    vi.mocked(sendConsignmentSaleEmail).mockClear()
  })

  afterEach(() => {
    globals.restore()
  })

  it('confirme une commande pending payée : order → paid, produit → sold, vente créée, email envoyé', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    await fulfillCheckoutSession(makeSession())

    const order = supabase.tables.orders.rows[0]
    expect(order?.status).toBe('paid')
    expect(order?.email).toBe('buyer@example.com')

    const product = supabase.tables.products.rows[0]
    expect(product?.status).toBe('sold')
    expect(product?.reserved_order_id).toBeNull()

    expect(supabase.tables.sales.rows).toHaveLength(1)
    expect(supabase.tables.sales.rows[0]?.sale_price).toBe(1850)
    expect(supabase.tables.product_status_history.rows).toHaveLength(1)
    expect(supabase.tables.product_status_history.rows[0]).toMatchObject({
      old_status: 'reserved',
      new_status: 'sold',
    })

    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  it('idempotence : un second appel (rejeu webhook + landing page) ne réécrit rien et n\'envoie aucun email', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    // 1er appel : confirme réellement la commande (barrière pending → paid).
    await fulfillCheckoutSession(makeSession())
    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(supabase.tables.sales.rows).toHaveLength(1)
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)

    // 2e appel (rejeu) : l'update conditionnel `eq('status', 'pending')` ne
    // matche plus aucune ligne → sortie anticipée, aucun effet de bord.
    await expect(fulfillCheckoutSession(makeSession())).resolves.toBeUndefined()

    expect(supabase.tables.sales.rows).toHaveLength(1)
    expect(supabase.tables.product_status_history.rows).toHaveLength(1)
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  it('fulfillment_method = "shipping" quand le coût de livraison Stripe est > 0', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    await fulfillCheckoutSession(makeSession({ shipping_cost: { amount_total: 990 } }))

    expect(supabase.tables.orders.rows[0]?.fulfillment_method).toBe('shipping')
  })

  it('fulfillment_method = "pickup" quand l\'option retrait Brèches (0 €) est choisie', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    await fulfillCheckoutSession(makeSession({ shipping_cost: { amount_total: 0 } }))

    expect(supabase.tables.orders.rows[0]?.fulfillment_method).toBe('pickup')
  })

  it('payment_status "unpaid" (paiement asynchrone en cours) : aucun fulfillment déclenché', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    await fulfillCheckoutSession(makeSession({ payment_status: 'unpaid' }))

    expect(supabase.tables.orders.rows[0]?.status).toBe('pending')
    expect(supabase.tables.products.rows[0]?.status).toBe('reserved')
    expect(supabase.tables.sales.rows).toHaveLength(0)
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled()
  })

  it('sold conditionnel : ne marque PAS "sold" un produit dont le verrou appartient à une AUTRE commande', async () => {
    const otherOrderId = '00000000-0000-4000-8000-000000000099'
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    // Le produit est verrouillé par une autre commande (ex. réservation admin
    // manuelle prise entre-temps) — le webhook de CETTE commande ne doit pas
    // le faire passer "sold".
    supabase.tables.products.rows.push(makeProductRow({ reserved_order_id: otherOrderId }))

    await fulfillCheckoutSession(makeSession())

    const product = supabase.tables.products.rows[0]
    expect(product?.status).toBe('reserved')
    expect(product?.reserved_order_id).toBe(otherOrderId)
    expect(supabase.tables.product_status_history.rows).toHaveLength(0)
  })

  it('déclenche l\'email de vente consignation avec la commission calculée quand le produit est en consignation', async () => {
    const consignmentId = '00000000-0000-4000-8000-000000000004'
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow({ price: 1850 }))
    supabase.tables.products.rows.push(makeProductRow({ is_consignment: true, consignment_id: consignmentId }))
    supabase.tables.consignments.rows.push(makeConsignmentRow({ id: consignmentId, agreed_price: 1500 }))

    await fulfillCheckoutSession(makeSession())

    expect(sendConsignmentSaleEmail).toHaveBeenCalledTimes(1)
    const payload = (sendConsignmentSaleEmail as Mock).mock.calls[0]?.[1] as { commissionAmount: number | null }
    expect(payload.commissionAmount).toBe(350) // 1850 - 1500
  })

  it('n\'envoie pas l\'email de confirmation acheteur si aucune clé Resend n\'est configurée (non-bloquant)', async () => {
    globals.config = { resendApiKey: undefined, public: { siteUrl: 'https://cgws.fr' } }
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())

    await expect(fulfillCheckoutSession(makeSession())).resolves.toBeUndefined()
    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled()
  })
})

// ─── releaseOrderReservation ───────────────────────────────────────────────

describe('releaseOrderReservation', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase

  beforeEach(() => {
    globals = stubServerGlobals()
    globals.config = { public: { siteUrl: 'https://cgws.fr' } }
    supabase = new FakeSupabase()
    globals.supabase = supabase
  })

  afterEach(() => {
    globals.restore()
  })

  it('libère une commande pending : annule la commande et restitue le stock', async () => {
    supabase.tables.orders.rows.push(makeOrderRow({ status: 'pending' }))
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow({ status: 'reserved', reserved_order_id: ORDER_ID, stock: 0 }))

    await releaseOrderReservation(ORDER_ID)

    expect(supabase.tables.orders.rows[0]?.status).toBe('cancelled')
    const product = supabase.tables.products.rows[0]
    expect(product?.stock).toBe(1)
    expect(product?.status).toBe('active')
    expect(product?.reserved_order_id).toBeNull()
  })

  it('idempotent : une commande déjà "paid" (barrière pending → cancelled déjà franchie) n\'est pas re-libérée', async () => {
    supabase.tables.orders.rows.push(makeOrderRow({ status: 'paid' }))
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow({ status: 'sold', reserved_order_id: null, stock: 0 }))

    await releaseOrderReservation(ORDER_ID)

    // Aucune transition : ni la commande ni le stock ne doivent bouger — pas
    // de double incrément.
    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(supabase.tables.products.rows[0]?.stock).toBe(0)
  })

  it('idempotent : une commande déjà "cancelled" (release rejoué) n\'incrémente pas le stock une 2e fois', async () => {
    supabase.tables.orders.rows.push(makeOrderRow({ status: 'cancelled' }))
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow({ status: 'active', reserved_order_id: null, stock: 1 }))

    await releaseOrderReservation(ORDER_ID)

    expect(supabase.tables.products.rows[0]?.stock).toBe(1)
  })

  it('ne réactive pas (status → active) un produit dont le verrou appartient à une autre commande', async () => {
    const otherOrderId = '00000000-0000-4000-8000-000000000099'
    supabase.tables.orders.rows.push(makeOrderRow({ status: 'pending' }))
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    // Le produit est verrouillé par une AUTRE commande — cette libération ne
    // doit jamais le rendre à nouveau achetable à la place de son détenteur.
    supabase.tables.products.rows.push(makeProductRow({ status: 'reserved', reserved_order_id: otherOrderId, stock: 0 }))

    await releaseOrderReservation(ORDER_ID)

    expect(supabase.tables.orders.rows[0]?.status).toBe('cancelled')
    const product = supabase.tables.products.rows[0]
    expect(product?.status).toBe('reserved')
    expect(product?.reserved_order_id).toBe(otherOrderId)
  })
})

// ─── Routage webhook (server/api/checkout/webhook.post.ts) ────────────────
//
// `fulfillCheckoutSession` / `releaseOrderReservation` sont ici stubbées en
// globals (spies) pour isoler la seule responsabilité de cette route : le
// ROUTAGE des types d'événements Stripe vers la bonne fonction. Leur
// comportement propre est déjà couvert en détail ci-dessus.

describe('webhook.post — routage des événements Stripe', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let fulfillSpy: Mock
  let releaseSpy: Mock
  let handler: (event: unknown) => Promise<{ received: boolean }>

  beforeAll(async () => {
    globals = stubServerGlobals()
    fulfillSpy = vi.fn().mockResolvedValue(undefined)
    releaseSpy = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('fulfillCheckoutSession', fulfillSpy)
    vi.stubGlobal('releaseOrderReservation', releaseSpy)

    const mod = await import('../../server/api/checkout/webhook.post')
    handler = mod.default as unknown as typeof handler
  })

  afterAll(() => {
    globals.restore()
  })

  beforeEach(() => {
    globals.config = { stripeWebhookSecret: 'whsec_test' }
    globals.headers = { 'stripe-signature': 'sig_test' }
    globals.rawBody = '{}'
    fulfillSpy.mockClear()
    releaseSpy.mockClear()
  })

  function setStripeEvent(stripeEvent: { type: string, data: { object: unknown } }): void {
    globals.stripe = {
      webhooks: {
        constructEvent: vi.fn(() => stripeEvent),
      },
    }
  }

  it('checkout.session.completed → fulfillment déclenché, jamais de release', async () => {
    const sessionObj = { id: 'cs_1', metadata: { order_id: ORDER_ID } }
    setStripeEvent({ type: 'checkout.session.completed', data: { object: sessionObj } })

    const result = await handler({})

    expect(result).toEqual({ received: true })
    expect(fulfillSpy).toHaveBeenCalledTimes(1)
    expect(fulfillSpy).toHaveBeenCalledWith(sessionObj)
    expect(releaseSpy).not.toHaveBeenCalled()
  })

  it('checkout.session.async_payment_succeeded → fulfillment déclenché', async () => {
    const sessionObj = { id: 'cs_2', metadata: { order_id: ORDER_ID } }
    setStripeEvent({ type: 'checkout.session.async_payment_succeeded', data: { object: sessionObj } })

    await handler({})

    expect(fulfillSpy).toHaveBeenCalledTimes(1)
    expect(releaseSpy).not.toHaveBeenCalled()
  })

  it('checkout.session.expired → release déclenchée SEULE (pas de fulfillment)', async () => {
    const sessionObj = { id: 'cs_3', metadata: { order_id: ORDER_ID }, client_reference_id: null }
    setStripeEvent({ type: 'checkout.session.expired', data: { object: sessionObj } })

    await handler({})

    expect(releaseSpy).toHaveBeenCalledTimes(1)
    expect(releaseSpy).toHaveBeenCalledWith(ORDER_ID)
    expect(fulfillSpy).not.toHaveBeenCalled()
  })

  it('checkout.session.async_payment_failed → release déclenchée SEULE (pas de fulfillment)', async () => {
    const sessionObj = { id: 'cs_4', metadata: {}, client_reference_id: ORDER_ID }
    setStripeEvent({ type: 'checkout.session.async_payment_failed', data: { object: sessionObj } })

    await handler({})

    expect(releaseSpy).toHaveBeenCalledTimes(1)
    expect(releaseSpy).toHaveBeenCalledWith(ORDER_ID)
    expect(fulfillSpy).not.toHaveBeenCalled()
  })

  it('événement non pertinent (ex. payment_intent.succeeded) : acquitté sans traitement', async () => {
    setStripeEvent({ type: 'payment_intent.succeeded', data: { object: {} } })

    const result = await handler({})

    expect(result).toEqual({ received: true })
    expect(fulfillSpy).not.toHaveBeenCalled()
    expect(releaseSpy).not.toHaveBeenCalled()
  })

  it('signature/secret absent(e) : rejette avant tout traitement', async () => {
    globals.config = { stripeWebhookSecret: undefined }

    await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
    expect(fulfillSpy).not.toHaveBeenCalled()
    expect(releaseSpy).not.toHaveBeenCalled()
  })
})

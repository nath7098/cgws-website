/**
 * US-104 — Capture serveur fiable `order_paid` (webhook Stripe → fulfillment).
 *
 * Stratégie : on exerce le VRAI service `server/services/analytics.ts` (avec
 * `posthog-node` mocké) à travers le VRAI `fulfillCheckoutSession` — les
 * assertions couvrent donc de bout en bout : le déclenchement uniquement
 * après fulfillment réussi, la résolution du distinct_id (metadata présent /
 * absent), les propriétés exactes (zéro PII), le no-op sans clé, la
 * non-propagation des échecs, et le flush serverless (`_shutdown` awaité).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import type { Tables } from '~/types/database.types'
import { sendOrderConfirmationEmail } from '~~/server/services/email'
import { fulfillCheckoutSession } from '../../server/utils/fulfillment'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

// ─── Mocks (hoistés par Vitest au-dessus des imports) ──────────────────────────

const posthogMocks = vi.hoisted(() => ({
  captureMock: vi.fn(),
  shutdownMock: vi.fn(async (): Promise<void> => {}),
  constructorCalls: [] as Array<{ key: string, options: Record<string, unknown> }>,
  failMode: { value: 'none' as 'none' | 'construct' | 'capture' },
}))

vi.mock('posthog-node', () => ({
  PostHog: class {
    capture = (message: unknown): void => {
      if (posthogMocks.failMode.value === 'capture') throw new Error('quota exceeded')
      posthogMocks.captureMock(message)
    }

    _shutdown = posthogMocks.shutdownMock

    constructor(key: string, options: Record<string, unknown>) {
      if (posthogMocks.failMode.value === 'construct') throw new Error('network down')
      posthogMocks.constructorCalls.push({ key, options })
    }
  },
}))

vi.mock('~~/server/services/email', () => ({
  sendConsignmentSaleEmail: vi.fn().mockResolvedValue(undefined),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const ORDER_ID = '00000000-0000-4000-8000-000000000001'
const PRODUCT_ID = '00000000-0000-4000-8000-000000000002'
const SESSION_ID = 'cs_test_123'
const ANALYTICS_ID = '0198a7b2-anon-4000-8000-ephemeral0001'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

/** Voir fulfillment.spec.ts pour la justification du cast unique. */
function makeSession(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  const base = {
    id: SESSION_ID,
    payment_status: 'paid',
    metadata: { order_id: ORDER_ID, analytics_id: ANALYTICS_ID },
    client_reference_id: ORDER_ID,
    payment_intent: 'pi_test_123',
    payment_method_types: ['card'],
    currency: 'eur',
    shipping_cost: { amount_total: 0 },
    collected_information: null,
    customer_details: { email: 'buyer@example.com', name: 'Jean Dupont', phone: '0600000000' },
    amount_subtotal: 185000,
    amount_total: 185000,
    ...overrides,
  }
  return base as unknown as Stripe.Checkout.Session
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('order_paid — capture serveur via fulfillment (US-104)', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase

  function seedPaidScenario(): void {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow())
    supabase.tables.products.rows.push(makeProductRow())
  }

  beforeEach(() => {
    globals = stubServerGlobals()
    globals.config = {
      resendApiKey: 'test_resend_key',
      public: {
        siteUrl: 'https://cgws.fr',
        posthogKey: 'phc_test_key',
        posthogHost: 'https://eu.i.posthog.com',
      },
    }
    supabase = new FakeSupabase()
    globals.supabase = supabase
    posthogMocks.captureMock.mockClear()
    posthogMocks.shutdownMock.mockClear()
    posthogMocks.constructorCalls.length = 0
    posthogMocks.failMode.value = 'none'
    vi.mocked(sendOrderConfirmationEmail).mockClear()
  })

  afterEach(() => {
    globals.restore()
  })

  it('capture order_paid après fulfillment réussi, avec le distinct_id du metadata et les propriétés exactes (zéro PII)', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession())

    expect(posthogMocks.captureMock).toHaveBeenCalledTimes(1)
    expect(posthogMocks.captureMock).toHaveBeenCalledWith({
      distinctId: ANALYTICS_ID,
      event: 'order_paid',
      properties: {
        amount_total: 1850,
        currency: 'eur',
        items_count: 1,
        payment_method_type: 'card',
        $process_person_profile: false,
      },
      disableGeoip: true,
    })
    // Client PostHog instancié pour le serverless : envoi immédiat, host UE.
    expect(posthogMocks.constructorCalls).toEqual([
      {
        key: 'phc_test_key',
        options: { host: 'https://eu.i.posthog.com', flushAt: 1, flushInterval: 0 },
      },
    ])
  })

  it('items_count = somme des quantités (US-096), montant converti en euros', async () => {
    supabase.tables.orders.rows.push(makeOrderRow())
    supabase.tables.order_items.rows.push(makeOrderItemRow({ price: 18, quantity: 3 }))
    supabase.tables.products.rows.push(makeProductRow())

    await fulfillCheckoutSession(makeSession({ amount_total: 6150 }))

    const message = posthogMocks.captureMock.mock.calls[0]?.[0] as {
      properties: Record<string, unknown>
    }
    expect(message.properties.items_count).toBe(3)
    expect(message.properties.amount_total).toBe(61.5)
  })

  it('metadata analytics_id absent → capture quand même, avec un id aléatoire (comptage exhaustif)', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession({ metadata: { order_id: ORDER_ID } }))

    expect(posthogMocks.captureMock).toHaveBeenCalledTimes(1)
    const message = posthogMocks.captureMock.mock.calls[0]?.[0] as { distinctId: string }
    expect(message.distinctId).toMatch(UUID_REGEX)
  })

  it('la capture intervient APRÈS le fulfillment (email de confirmation inclus), jamais avant', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession())

    const emailOrder = vi.mocked(sendOrderConfirmationEmail).mock.invocationCallOrder[0]!
    const captureOrder = posthogMocks.captureMock.mock.invocationCallOrder[0]!
    expect(captureOrder).toBeGreaterThan(emailOrder)
    // Ordre confirmé + commande bien payée.
    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
  })

  it('flush serverless : _shutdown est awaité après la capture (aucun événement perdu avec la lambda)', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession())

    expect(posthogMocks.shutdownMock).toHaveBeenCalledTimes(1)
    expect(posthogMocks.shutdownMock.mock.invocationCallOrder[0]!)
      .toBeGreaterThan(posthogMocks.captureMock.mock.invocationCallOrder[0]!)
  })

  it('rejeu (commande déjà payée) → AUCUNE nouvelle capture (exactement une par commande)', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession())
    await fulfillCheckoutSession(makeSession())

    expect(posthogMocks.captureMock).toHaveBeenCalledTimes(1)
  })

  it('paiement non encaissé (payment_status unpaid) → aucune capture', async () => {
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession({ payment_status: 'unpaid' }))

    expect(posthogMocks.captureMock).not.toHaveBeenCalled()
    expect(supabase.tables.orders.rows[0]?.status).toBe('pending')
  })

  it('commande inconnue (barrière non franchie) → aucune capture', async () => {
    // Aucune ligne orders : le fulfillment sort sans rien confirmer.
    await fulfillCheckoutSession(makeSession())

    expect(posthogMocks.captureMock).not.toHaveBeenCalled()
  })

  it('clé PostHog absente → no-op total (posthog-node jamais instancié), fulfillment intact', async () => {
    globals.config = { resendApiKey: 'test_resend_key', public: { siteUrl: 'https://cgws.fr' } }
    seedPaidScenario()

    await fulfillCheckoutSession(makeSession())

    expect(posthogMocks.constructorCalls).toHaveLength(0)
    expect(posthogMocks.captureMock).not.toHaveBeenCalled()
    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  it('PostHog indisponible (échec réseau à l\'instanciation) → fulfillment aboutit, erreur avalée et loggée', async () => {
    posthogMocks.failMode.value = 'construct'
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    seedPaidScenario()

    await expect(fulfillCheckoutSession(makeSession())).resolves.toBeUndefined()

    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(supabase.tables.sales.rows).toHaveLength(1)
    expect(sendOrderConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('échec de capture (quota) → jamais propagé, fulfillment intact', async () => {
    posthogMocks.failMode.value = 'capture'
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    seedPaidScenario()

    await expect(fulfillCheckoutSession(makeSession())).resolves.toBeUndefined()

    expect(supabase.tables.orders.rows[0]?.status).toBe('paid')
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

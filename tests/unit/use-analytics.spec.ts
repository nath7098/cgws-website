import { beforeEach, describe, expect, it } from 'vitest'
import {
  setAnalyticsClient,
  useAnalytics,
} from '~/composables/useAnalytics'
import type {
  AnalyticsClient,
  AnalyticsProperties,
} from '~/composables/useAnalytics'

// NB (US-103) : `capture()` est désormais verrouillé au compilateur sur la
// taxonomie de app/utils/analytics-events.ts — les tests utilisent donc
// exclusivement des événements de la taxonomie.

// ─── Fixtures ──────────────────────────────────────────────────────────────────

interface RecordedCall {
  event: string
  properties?: AnalyticsProperties
}

interface MockClient extends AnalyticsClient {
  calls: RecordedCall[]
}

function makeMockClient(): MockClient {
  const calls: RecordedCall[] = []
  return {
    calls,
    capture(event: string, properties?: AnalyticsProperties): void {
      calls.push(properties === undefined ? { event } : { event, properties })
    },
  }
}

/**
 * Le composable porte un état module (client + buffer). On le remet à zéro
 * entre chaque test : brancher un client jetable draine le buffer, puis on
 * débranche.
 */
beforeEach(() => {
  setAnalyticsClient(makeMockClient())
  setAnalyticsClient(null)
})

// ─── No-op silencieux sans client (clé PostHog absente) ────────────────────────

describe('useAnalytics — no-op sans client analytics', () => {
  it('capture() ne lève aucune erreur quand aucun client n\'est branché', () => {
    const { capture } = useAnalytics()
    expect(() =>
      capture('cart_item_added', { product_id: 'p-1', quantity: 1, price: 120 }),
    ).not.toThrow()
    expect(() => capture('contact_submitted')).not.toThrow()
  })

  it('aucun événement n\'atteint un client débranché', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)
    setAnalyticsClient(null)

    const { capture } = useAnalytics()
    capture('contact_submitted')

    expect(mock.calls).toHaveLength(0)
  })
})

// ─── Transmission une fois le client branché ───────────────────────────────────

describe('useAnalytics — client branché', () => {
  it('transmet événement et propriétés au client', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)

    const { capture } = useAnalytics()
    capture('product_viewed', {
      product_id: 'p-1',
      product_slug: 'selle-western-billy-cook',
      category: 'selles',
      price: 1850,
      is_consignment: true,
    })

    expect(mock.calls).toEqual([
      {
        event: 'product_viewed',
        properties: {
          product_id: 'p-1',
          product_slug: 'selle-western-billy-cook',
          category: 'selles',
          price: 1850,
          is_consignment: true,
        },
      },
    ])
  })

  it('transmet un événement sans propriétés', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)

    const { capture } = useAnalytics()
    capture('consignment_form_viewed')

    expect(mock.calls).toEqual([{ event: 'consignment_form_viewed' }])
  })
})

// ─── Buffer pré-init (init PostHog différée) ───────────────────────────────────

describe('useAnalytics — buffer avant init différée', () => {
  it('rejoue les événements bufferisés, dans l\'ordre, au branchement du client', () => {
    const { capture } = useAnalytics()
    capture('cart_item_added', { product_id: 'p-1', quantity: 2, price: 45 })
    capture('checkout_opened', { cart_value: 90, items_count: 2 })

    const mock = makeMockClient()
    setAnalyticsClient(mock)

    expect(mock.calls).toEqual([
      { event: 'cart_item_added', properties: { product_id: 'p-1', quantity: 2, price: 45 } },
      { event: 'checkout_opened', properties: { cart_value: 90, items_count: 2 } },
    ])
  })

  it('borne le buffer : au-delà de 20 événements pré-init, les suivants sont ignorés', () => {
    const { capture } = useAnalytics()
    for (let i = 0; i < 25; i++) {
      capture('cart_item_added', { product_id: `p-${i}`, quantity: 1, price: i })
    }

    const mock = makeMockClient()
    setAnalyticsClient(mock)

    expect(mock.calls).toHaveLength(20)
    expect(mock.calls[0]?.properties?.product_id).toBe('p-0')
    expect(mock.calls[19]?.properties?.product_id).toBe('p-19')
  })

  it('ne rejoue pas deux fois le buffer si un second client est branché', () => {
    const { capture } = useAnalytics()
    capture('contact_submitted')

    const first = makeMockClient()
    setAnalyticsClient(first)

    const second = makeMockClient()
    setAnalyticsClient(second)

    expect(first.calls).toEqual([{ event: 'contact_submitted' }])
    expect(second.calls).toHaveLength(0)
  })
})

// ─── Résilience (US-103) — un client qui lève ne casse jamais le parcours ──────

describe('useAnalytics — résilience client défaillant', () => {
  function makeThrowingClient(): AnalyticsClient {
    return {
      capture(): never {
        throw new Error('blocked by adblocker')
      },
    }
  }

  it('capture() n\'échoue pas si le client lève', () => {
    setAnalyticsClient(makeThrowingClient())

    const { capture } = useAnalytics()
    expect(() =>
      capture('cart_item_added', { product_id: 'p-1', quantity: 1, price: 10 }),
    ).not.toThrow()
    expect(() => capture('contact_submitted')).not.toThrow()
  })

  it('le flush du buffer n\'échoue pas si le client lève', () => {
    const { capture } = useAnalytics()
    capture('contact_submitted')
    capture('consignment_form_viewed')

    expect(() => setAnalyticsClient(makeThrowingClient())).not.toThrow()
  })
})

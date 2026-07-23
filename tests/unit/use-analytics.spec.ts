import { beforeEach, describe, expect, it } from 'vitest'
import {
  setAnalyticsClient,
  useAnalytics,
} from '~/composables/useAnalytics'
import type {
  AnalyticsClient,
  AnalyticsProperties,
} from '~/composables/useAnalytics'

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
    expect(() => capture('cta_clicked', { placement: 'hero' })).not.toThrow()
    expect(() => capture('page_scrolled')).not.toThrow()
  })

  it('aucun événement n\'atteint un client débranché', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)
    setAnalyticsClient(null)

    const { capture } = useAnalytics()
    capture('cta_clicked')

    expect(mock.calls).toHaveLength(0)
  })
})

// ─── Transmission une fois le client branché ───────────────────────────────────

describe('useAnalytics — client branché', () => {
  it('transmet événement et propriétés au client', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)

    const { capture } = useAnalytics()
    capture('product_viewed', { category: 'selles', price: 1850 })

    expect(mock.calls).toEqual([
      { event: 'product_viewed', properties: { category: 'selles', price: 1850 } },
    ])
  })

  it('transmet un événement sans propriétés', () => {
    const mock = makeMockClient()
    setAnalyticsClient(mock)

    const { capture } = useAnalytics()
    capture('catalogue_opened')

    expect(mock.calls).toEqual([{ event: 'catalogue_opened' }])
  })
})

// ─── Buffer pré-init (init PostHog différée) ───────────────────────────────────

describe('useAnalytics — buffer avant init différée', () => {
  it('rejoue les événements bufferisés, dans l\'ordre, au branchement du client', () => {
    const { capture } = useAnalytics()
    capture('first', { rank: 1 })
    capture('second', { rank: 2 })

    const mock = makeMockClient()
    setAnalyticsClient(mock)

    expect(mock.calls).toEqual([
      { event: 'first', properties: { rank: 1 } },
      { event: 'second', properties: { rank: 2 } },
    ])
  })

  it('borne le buffer : au-delà de 20 événements pré-init, les suivants sont ignorés', () => {
    const { capture } = useAnalytics()
    for (let i = 0; i < 25; i++) {
      capture(`event_${i}`)
    }

    const mock = makeMockClient()
    setAnalyticsClient(mock)

    expect(mock.calls).toHaveLength(20)
    expect(mock.calls[0]).toEqual({ event: 'event_0' })
    expect(mock.calls[19]).toEqual({ event: 'event_19' })
  })

  it('ne rejoue pas deux fois le buffer si un second client est branché', () => {
    const { capture } = useAnalytics()
    capture('buffered_once')

    const first = makeMockClient()
    setAnalyticsClient(first)

    const second = makeMockClient()
    setAnalyticsClient(second)

    expect(first.calls).toEqual([{ event: 'buffered_once' }])
    expect(second.calls).toHaveLength(0)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '~/stores/cart'
import { setAnalyticsClient } from '~/composables/useAnalytics'
import type {
  AnalyticsClient,
  AnalyticsProperties,
} from '~/composables/useAnalytics'
import type { Product } from '~/types'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'selle-western-billy-cook',
    title: 'Selle western Billy Cook 16"',
    description: 'Selle de reining en excellent état',
    price: 1850,
    category: 'selles',
    brand: 'Billy Cook',
    size: '16"',
    condition: 'excellent',
    isConsignment: true,
    consignmentId: undefined,
    status: 'active',
    images: [],
    stock: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

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

/** Client branché AVANT chaque test (draine aussi le buffer résiduel). */
let analytics: MockClient

beforeEach(() => {
  setActivePinia(createPinia())
  // Drainer le buffer module d'un éventuel test précédent, puis brancher
  // un client neuf dont on observera les captures.
  setAnalyticsClient(makeMockClient())
  analytics = makeMockClient()
  setAnalyticsClient(analytics)
  useCartStore().clear()
})

// ─── cart_item_added — capturé UNIQUEMENT dans la branche succès de add() ──────

describe('cart store — instrumentation cart_item_added (US-103)', () => {
  it('capture cart_item_added avec exactement product_id, quantity et price au succès', () => {
    const cart = useCartStore()
    const product = makeProduct({ isConsignment: false, stock: 5 })

    expect(cart.add(product, 2)).toBe(true)

    expect(analytics.calls).toEqual([
      {
        event: 'cart_item_added',
        properties: { product_id: product.id, quantity: 2, price: 1850 },
      },
    ])
  })

  it('quantité par défaut 1 (pièce unique / consignation)', () => {
    const cart = useCartStore()

    expect(cart.add(makeProduct())).toBe(true)

    expect(analytics.calls).toHaveLength(1)
    expect(analytics.calls[0]?.properties?.quantity).toBe(1)
  })

  it('ne capture RIEN pour un produit non achetable (status ≠ active)', () => {
    const cart = useCartStore()

    expect(cart.add(makeProduct({ status: 'sold' }))).toBe(false)
    expect(cart.add(makeProduct({ status: 'reserved' }))).toBe(false)

    expect(analytics.calls).toHaveLength(0)
  })

  it('ne capture RIEN sur un no-op (pièce unique déjà en panier)', () => {
    const cart = useCartStore()
    const product = makeProduct()

    expect(cart.add(product)).toBe(true)
    expect(cart.add(product)).toBe(false)

    expect(analytics.calls).toHaveLength(1)
  })

  it('ne capture RIEN sur un no-op de quantité identique (US-096)', () => {
    const cart = useCartStore()
    const product = makeProduct({ isConsignment: false, stock: 5 })

    expect(cart.add(product, 3)).toBe(true)
    expect(cart.add(product, 3)).toBe(false)

    expect(analytics.calls).toHaveLength(1)
  })

  it('capture le remplacement de quantité avec la NOUVELLE quantité (US-096)', () => {
    const cart = useCartStore()
    const product = makeProduct({ isConsignment: false, stock: 5 })

    expect(cart.add(product, 2)).toBe(true)
    expect(cart.add(product, 4)).toBe(true)

    expect(analytics.calls).toHaveLength(2)
    expect(analytics.calls[1]?.properties?.quantity).toBe(4)
  })

  it('un client analytics défaillant n\'empêche jamais l\'ajout au panier (résilience)', () => {
    setAnalyticsClient({
      capture(): never {
        throw new Error('blocked')
      },
    })
    const cart = useCartStore()

    expect(cart.add(makeProduct())).toBe(true)
    expect(cart.count).toBe(1)
  })
})

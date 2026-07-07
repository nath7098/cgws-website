import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  SHIPPING_FLAT_RATE,
  addCartLine,
  computeShippingCost,
  computeSubtotal,
  computeTotal,
  removeCartLine,
  roundMoney,
  toStripeAmount,
} from '#shared/utils/checkout'
import { useCartStore } from '~/stores/cart'
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
    images: ['https://example.supabase.co/storage/v1/object/public/product-images/products/a/1.jpg'],
    stock: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

// ─── Logique pure partagée (#shared/utils/checkout) ───────────────────────────

describe('checkout — helpers monétaires', () => {
  it('roundMoney arrondit à 2 décimales sans dérive flottante', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(1850.005)).toBe(1850.01)
  })

  it('toStripeAmount convertit les euros en centimes entiers', () => {
    expect(toStripeAmount(1850)).toBe(185000)
    expect(toStripeAmount(9.9)).toBe(990)
    expect(toStripeAmount(19.99)).toBe(1999)
  })
})

describe('checkout — addCartLine (dé-duplication pièce unique)', () => {
  it('ajoute une ligne absente du panier', () => {
    const items = addCartLine([], { productId: 'a', price: 100 })
    expect(items).toHaveLength(1)
  })

  it('ne duplique jamais une pièce déjà présente (stock 1) — quantité reste à 1', () => {
    const initial = [{ productId: 'a', price: 100 }]
    const result = addCartLine(initial, { productId: 'a', price: 100 })
    expect(result).toHaveLength(1)
    // Même référence : permet au caller de détecter le no-op
    expect(result).toBe(initial)
  })

  it('accepte des produits distincts', () => {
    let items = addCartLine<{ productId: string, price: number }>([], { productId: 'a', price: 100 })
    items = addCartLine(items, { productId: 'b', price: 50 })
    expect(items).toHaveLength(2)
  })
})

describe('checkout — removeCartLine', () => {
  it('retire uniquement la ligne ciblée', () => {
    const items = [
      { productId: 'a', price: 100 },
      { productId: 'b', price: 50 },
    ]
    const result = removeCartLine(items, 'a')
    expect(result).toHaveLength(1)
    expect(result[0]?.productId).toBe('b')
  })
})

describe('checkout — calculs de totaux', () => {
  it('computeSubtotal additionne les prix (1 exemplaire par ligne)', () => {
    expect(computeSubtotal([{ price: 1850 }, { price: 79.9 }, { price: 45.5 }])).toBe(1975.4)
    expect(computeSubtotal([])).toBe(0)
  })

  it('computeShippingCost : forfait en livraison, gratuit en retrait', () => {
    expect(computeShippingCost('shipping')).toBe(SHIPPING_FLAT_RATE)
    expect(computeShippingCost('pickup')).toBe(0)
  })

  it('computeTotal avec frais de port (livraison)', () => {
    expect(computeTotal(1850, 'shipping')).toBe(roundMoney(1850 + SHIPPING_FLAT_RATE))
  })

  it('computeTotal sans frais de port (retrait à Brèches)', () => {
    expect(computeTotal(1850, 'pickup')).toBe(1850)
  })
})

// ─── Store Pinia (app/stores/cart.ts) ─────────────────────────────────────────

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ajoute un produit actif et incrémente le compteur', () => {
    const cart = useCartStore()
    expect(cart.add(makeProduct())).toBe(true)
    expect(cart.count).toBe(1)
    expect(cart.isEmpty).toBe(false)
    expect(cart.items[0]?.title).toBe('Selle western Billy Cook 16"')
  })

  it('refuse un produit non achetable (sold / reserved / inactive)', () => {
    const cart = useCartStore()
    expect(cart.add(makeProduct({ status: 'sold' }))).toBe(false)
    expect(cart.add(makeProduct({ status: 'reserved' }))).toBe(false)
    expect(cart.add(makeProduct({ status: 'inactive' }))).toBe(false)
    expect(cart.count).toBe(0)
  })

  it('ne duplique pas une pièce unique déjà dans le panier', () => {
    const cart = useCartStore()
    const product = makeProduct()
    expect(cart.add(product)).toBe(true)
    expect(cart.add(product)).toBe(false)
    expect(cart.count).toBe(1)
  })

  it('retire un article par productId', () => {
    const cart = useCartStore()
    const a = makeProduct()
    const b = makeProduct({ id: '00000000-0000-4000-8000-000000000002', slug: 'bottes-ariat', title: 'Bottes Ariat', price: 120 })
    cart.add(a)
    cart.add(b)
    cart.remove(a.id)
    expect(cart.count).toBe(1)
    expect(cart.items[0]?.productId).toBe(b.id)
  })

  it('vide entièrement le panier', () => {
    const cart = useCartStore()
    cart.add(makeProduct())
    cart.clear()
    expect(cart.isEmpty).toBe(true)
    expect(cart.subtotal).toBe(0)
  })

  it('calcule le sous-total du panier', () => {
    const cart = useCartStore()
    cart.add(makeProduct({ price: 1850 }))
    cart.add(makeProduct({ id: '00000000-0000-4000-8000-000000000002', price: 79.9 }))
    expect(cart.subtotal).toBe(1929.9)
  })

  it('exclut les articles indisponibles du sous-total', () => {
    const cart = useCartStore()
    const a = makeProduct({ price: 1850 })
    const b = makeProduct({ id: '00000000-0000-4000-8000-000000000002', price: 79.9 })
    cart.add(a)
    cart.add(b)
    // Simule un produit vendu entre-temps (état posé par refreshAvailability)
    cart.unavailableIds = [a.id]
    expect(cart.subtotal).toBe(79.9)
    expect(cart.availableItems).toHaveLength(1)
    expect(cart.unavailableItems).toHaveLength(1)
    // total avec/sans frais de port sur la base du sous-total disponible
    expect(computeTotal(cart.subtotal, 'shipping')).toBe(roundMoney(79.9 + SHIPPING_FLAT_RATE))
    expect(computeTotal(cart.subtotal, 'pickup')).toBe(79.9)
  })

  it('retirer un article indisponible nettoie aussi son marquage', () => {
    const cart = useCartStore()
    const a = makeProduct()
    cart.add(a)
    cart.unavailableIds = [a.id]
    cart.remove(a.id)
    expect(cart.unavailableIds).toHaveLength(0)
    expect(cart.isEmpty).toBe(true)
  })
})

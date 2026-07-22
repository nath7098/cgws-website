/**
 * US-093 (item 6) — Tests unitaires de GET /api/depositor/consignments après
 * suppression du N+1 : le nombre de requêtes Supabase doit être CONSTANT
 * (1 `consignments` + au plus 1 `products` + au plus 1 `sales`, indépendant du
 * nombre de consignations vendues), et la réponse `DepositorConsignmentView`
 * strictement identique à l'ancienne implémentation par boucle.
 *
 * Les barrières de sécurité US-066 sont également couvertes : filtre
 * `depositor_email` dérivé du JWT uniquement, échappement ILIKE + second filtre
 * applicatif, zéro fuite de `notes` / commission brute.
 *
 * Même infrastructure que checkout-session.spec.ts : stubs des globals Nitro
 * (tests/unit/helpers/testGlobals.ts) + import dynamique de la route. Le client
 * d'authentification (`createClient` de @supabase/supabase-js, importé
 * explicitement par la route) est mocké au niveau module.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tables } from '~/types/database.types'
import type { DepositorConsignmentView } from '~/types'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

// ─── Mock du client d'auth (JWT → user) ──────────────────────────────────────
// `vi.hoisted` : le factory de `vi.mock` est hissé avant les imports — l'état
// mutable doit l'être aussi pour être accessible depuis le factory.
const authMock = vi.hoisted(() => {
  const state: { email: string | null } = { email: null }
  return { state }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () =>
        authMock.state.email
          ? { data: { user: { email: authMock.state.email } }, error: null }
          : { data: { user: null }, error: { message: 'invalid token' } },
    },
  }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEPOSITOR_EMAIL = 'jane_doe@example.com'

let fixtureId = 1
function fid(prefix: string): string {
  return `00000000-0000-4000-9000-${prefix}${String(fixtureId++).padStart(12 - prefix.length, '0')}`
}

function makeConsignmentRow(overrides: Partial<Tables<'consignments'>> = {}): Tables<'consignments'> {
  return {
    id: fid('c'),
    depositor_name: 'Jane Doe',
    depositor_email: DEPOSITOR_EMAIL,
    depositor_phone: null,
    item_description: 'Selle western Circle Y 16"',
    brand: 'Circle Y',
    condition: 'excellent',
    asking_price: 1500,
    agreed_price: 1400,
    images: [],
    status: 'pending',
    notes: 'NOTE INTERNE — ne doit jamais fuiter',
    created_at: '2026-07-01T10:00:00.000Z',
    ...overrides,
  }
}

function makeProductRow(overrides: Partial<Tables<'products'>> = {}): Tables<'products'> {
  return {
    id: fid('p'),
    slug: 'selle-western-circle-y',
    title: 'Selle western Circle Y 16"',
    description: null,
    price: 1400,
    category: 'selles',
    brand: 'Circle Y',
    size: '16"',
    condition: 'excellent',
    is_consignment: true,
    consignment_id: null,
    status: 'sold',
    reserved_order_id: null,
    reserved_until: null,
    images: [],
    stock: 0,
    created_at: '2026-07-02T10:00:00.000Z',
    updated_at: '2026-07-02T10:00:00.000Z',
    ...overrides,
  }
}

function makeSaleRow(overrides: Partial<Tables<'sales'>> = {}): Tables<'sales'> {
  return {
    id: fid('s'),
    product_id: null,
    client_id: null,
    sale_price: 1400,
    commission_amount: 280,
    payment_method: 'card',
    sale_date: '2026-07-03',
    notes: null,
    created_at: '2026-07-03T10:00:00.000Z',
    ...overrides,
  }
}

// ─── Specs ────────────────────────────────────────────────────────────────────

describe('GET /api/depositor/consignments — batch .in() sans N+1 (US-093)', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase
  let handler: (event: unknown) => Promise<{ consignments: DepositorConsignmentView[] }>

  beforeAll(async () => {
    globals = stubServerGlobals()
    const mod = await import('../../server/api/depositor/consignments.get')
    handler = mod.default as unknown as typeof handler
  })

  afterAll(() => {
    globals.restore()
  })

  beforeEach(() => {
    supabase = new FakeSupabase()
    globals.supabase = supabase
    globals.config = { public: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'anon' } }
    globals.headers = { authorization: 'Bearer valid-token' }
    authMock.state.email = DEPOSITOR_EMAIL
  })

  it('401 sans header Authorization', async () => {
    globals.headers = {}
    await expect(handler({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('401 si le JWT est invalide (getUser sans user)', async () => {
    authMock.state.email = null
    await expect(handler({})).rejects.toMatchObject({ statusCode: 401 })
  })

  it('nombre de requêtes CONSTANT : 3 appels .from() quel que soit le nombre de consignations vendues', async () => {
    // 4 consignations vendues, chacune avec produit + vente : l'ancien code
    // aurait émis 1 + 4×2 = 9 requêtes ; le batch doit en émettre exactement 3.
    for (let i = 0; i < 4; i++) {
      const consignment = makeConsignmentRow({ status: 'sold' })
      const product = makeProductRow({ consignment_id: consignment.id })
      supabase.tables.consignments.rows.push(consignment)
      supabase.tables.products.rows.push(product)
      supabase.tables.sales.rows.push(makeSaleRow({ product_id: product.id }))
    }

    const fromSpy = vi.spyOn(supabase, 'from')
    const result = await handler({})

    expect(result.consignments).toHaveLength(4)
    expect(fromSpy).toHaveBeenCalledTimes(3)
    expect(fromSpy.mock.calls.map(call => call[0])).toEqual(['consignments', 'products', 'sales'])
  })

  it('aucune consignation vendue : une seule requête (consignments), zéro requête products/sales', async () => {
    supabase.tables.consignments.rows.push(makeConsignmentRow({ status: 'pending' }))
    supabase.tables.consignments.rows.push(makeConsignmentRow({ status: 'accepted' }))

    const fromSpy = vi.spyOn(supabase, 'from')
    const result = await handler({})

    expect(result.consignments).toHaveLength(2)
    expect(fromSpy).toHaveBeenCalledTimes(1)
    expect(fromSpy.mock.calls[0]?.[0]).toBe('consignments')
  })

  it('vendue avec commission enregistrée : salePrice + net à reverser calculés serveur', async () => {
    const consignment = makeConsignmentRow({ status: 'sold', agreed_price: 1400 })
    const product = makeProductRow({ consignment_id: consignment.id })
    supabase.tables.consignments.rows.push(consignment)
    supabase.tables.products.rows.push(product)
    supabase.tables.sales.rows.push(makeSaleRow({ product_id: product.id, sale_price: 1400, commission_amount: 280 }))

    const { consignments } = await handler({})

    expect(consignments[0]).toMatchObject({
      id: consignment.id,
      status: 'sold',
      salePrice: 1400,
      depositorAmount: 1120, // 1400 − 280, jamais la commission brute
    })
  })

  it('vendue sans commission enregistrée : fallback taux public 20 %', async () => {
    const consignment = makeConsignmentRow({ status: 'sold' })
    const product = makeProductRow({ consignment_id: consignment.id })
    supabase.tables.consignments.rows.push(consignment)
    supabase.tables.products.rows.push(product)
    supabase.tables.sales.rows.push(makeSaleRow({ product_id: product.id, sale_price: 1000, commission_amount: null }))

    const { consignments } = await handler({})

    expect(consignments[0]?.salePrice).toBe(1000)
    expect(consignments[0]?.depositorAmount).toBe(800)
  })

  it('vendue sans vente retrouvée : le net à reverser retombe sur le prix accordé', async () => {
    supabase.tables.consignments.rows.push(makeConsignmentRow({ status: 'sold', agreed_price: 1200 }))

    const { consignments } = await handler({})

    expect(consignments[0]?.salePrice).toBeUndefined()
    expect(consignments[0]?.depositorAmount).toBe(1200)
  })

  it('plusieurs ventes pour un même produit : seule la plus récente est retenue', async () => {
    const consignment = makeConsignmentRow({ status: 'sold' })
    const product = makeProductRow({ consignment_id: consignment.id })
    supabase.tables.consignments.rows.push(consignment)
    supabase.tables.products.rows.push(product)
    supabase.tables.sales.rows.push(makeSaleRow({
      product_id: product.id,
      sale_price: 900,
      commission_amount: 180,
      created_at: '2026-06-01T10:00:00.000Z',
    }))
    supabase.tables.sales.rows.push(makeSaleRow({
      product_id: product.id,
      sale_price: 1100,
      commission_amount: 220,
      created_at: '2026-07-01T10:00:00.000Z',
    }))

    const { consignments } = await handler({})

    expect(consignments[0]?.salePrice).toBe(1100)
    expect(consignments[0]?.depositorAmount).toBe(880)
  })

  it('sécurité US-066 : ne retourne QUE les consignations de l\'email du JWT (casse ignorée, « _ » non joker)', async () => {
    supabase.tables.consignments.rows.push(makeConsignmentRow({ depositor_email: 'Jane_Doe@Example.com' }))
    // Sans échappement ILIKE, « _ » matcherait n'importe quel caractère —
    // cette ligne d'un AUTRE déposant ne doit jamais sortir.
    supabase.tables.consignments.rows.push(makeConsignmentRow({ depositor_email: 'janexdoe@example.com' }))
    supabase.tables.consignments.rows.push(makeConsignmentRow({ depositor_email: 'autre@example.com' }))

    const { consignments } = await handler({})

    expect(consignments).toHaveLength(1)
  })

  it('sécurité US-066 : zéro fuite — ni notes internes, ni commission brute dans la réponse', async () => {
    const consignment = makeConsignmentRow({ status: 'sold', notes: 'SECRET' })
    const product = makeProductRow({ consignment_id: consignment.id })
    supabase.tables.consignments.rows.push(consignment)
    supabase.tables.products.rows.push(product)
    supabase.tables.sales.rows.push(makeSaleRow({ product_id: product.id }))

    const { consignments } = await handler({})
    const keys = Object.keys(consignments[0] ?? {})

    expect(keys).not.toContain('notes')
    expect(keys.some(key => key.toLowerCase().includes('commission'))).toBe(false)
    expect(keys.sort()).toEqual([
      'agreedPrice',
      'askingPrice',
      'brand',
      'condition',
      'createdAt',
      'depositorAmount',
      'id',
      'itemDescription',
      'salePrice',
      'status',
    ])
  })
})

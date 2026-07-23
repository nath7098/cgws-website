/**
 * US-091 — Tests unitaires de la création de session checkout embarqué
 * (server/api/checkout/session.post.ts) : réservation atomique par RPC,
 * rollback ciblé + 409 sur course perdue.
 *
 * Même portée/exclusion que fulfillment.spec.ts : l'atomicité SQL réelle de
 * la RPC `reserve_product_unit` (migration 006) n'est pas testée ici — seule
 * l'ORCHESTRATION de la route (boucle de réservation, rollback, réponse HTTP)
 * est couverte, via le fake Supabase + un fake client Stripe, sans appel
 * réseau. `defineEventHandler` étant exécuté au chargement du module, la
 * route est importée dynamiquement (`import()`) APRÈS le stub des globals
 * Nitro (voir tests/unit/helpers/testGlobals.ts).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Tables } from '~/types/database.types'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

const PRODUCT_A_ID = '00000000-0000-4000-8000-0000000000a1'
const PRODUCT_B_ID = '00000000-0000-4000-8000-0000000000b2'

function makeProductRow(overrides: Partial<Tables<'products'>> = {}): Tables<'products'> {
  return {
    id: PRODUCT_A_ID,
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
    status: 'active',
    reserved_order_id: null,
    reserved_until: null,
    images: [],
    stock: 1,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

interface FakeCheckoutSessionCreateResult {
  id: string
  client_secret: string | null
}

interface SessionPostRequestBody {
  items: Array<{ productId: string, quantity: number }>
  previousOrderId?: string
}

interface SessionPostSuccessResponse {
  clientSecret: string
  orderId: string
}

describe('POST /api/checkout/session — réservation atomique + rollback', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase
  let stripeCreate: ReturnType<typeof vi.fn>
  let handler: (event: unknown) => Promise<SessionPostSuccessResponse>

  beforeAll(async () => {
    globals = stubServerGlobals()
    const mod = await import('../../server/api/checkout/session.post')
    handler = mod.default as unknown as typeof handler
  })

  afterAll(() => {
    globals.restore()
  })

  beforeEach(() => {
    supabase = new FakeSupabase()
    globals.supabase = supabase
    globals.config = { public: { siteUrl: 'https://cgws.fr' } }
    // `globals` est partagé sur tout le describe (import unique du handler en
    // beforeAll) : on réinitialise les statuts de réponse entre chaque test.
    globals.responseStatuses = []
    stripeCreate = vi.fn(async (): Promise<FakeCheckoutSessionCreateResult> => ({
      id: 'cs_test_new',
      client_secret: 'cs_test_new_secret',
    }))
    globals.stripe = { checkout: { sessions: { create: stripeCreate } } }
  })

  function setBody(body: SessionPostRequestBody): void {
    globals.body = body
  }

  it('réservation réussie pour tous les produits : session Stripe créée, commande référencée', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 1, status: 'active' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 1 }] })

    const result = await handler({})

    expect(result.clientSecret).toBe('cs_test_new_secret')
    expect(result.orderId).toBeTruthy()
    expect(stripeCreate).toHaveBeenCalledTimes(1)

    const order = supabase.tables.orders.rows.find(o => o.id === result.orderId)
    expect(order?.status).toBe('pending')
    expect(order?.stripe_session_id).toBe('cs_test_new')

    const items = supabase.tables.order_items.rows.filter(i => i.order_id === result.orderId)
    expect(items).toHaveLength(1)
    expect(items[0]?.product_id).toBe(PRODUCT_A_ID)
    expect(items[0]?.quantity).toBe(1)

    // Dernière unité réservée : le produit passe "reserved" + verrouillé sur
    // CETTE commande.
    const product = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    expect(product?.status).toBe('reserved')
    expect(product?.reserved_order_id).toBe(result.orderId)
    expect(product?.stock).toBe(0)

    expect(globals.responseStatuses).toContain(201)
  })

  it('produit multi-stock réservé (pas la dernière unité) : reste "active", achetable par d\'autres', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 3, status: 'active' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 1 }] })

    const result = await handler({})

    const product = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    expect(product?.stock).toBe(2)
    expect(product?.status).toBe('active')
    expect(product?.reserved_order_id).toBeNull()
    expect(result.clientSecret).toBeTruthy()
  })

  // ─── US-096 — achat multiple (quantité > 1) ───────────────────────────────

  it('achat multiple : réserve N unités du même produit, quantity Stripe = N, order_items.quantity = N', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 5, status: 'active' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 3 }] })

    const result = await handler({})

    const product = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    // 3 unités réservées sur 5 : stock résiduel 2, encore "active" (pas la
    // dernière unité) — achetable par d'autres visiteurs.
    expect(product?.stock).toBe(2)
    expect(product?.status).toBe('active')

    const items = supabase.tables.order_items.rows.filter(i => i.order_id === result.orderId)
    expect(items).toHaveLength(1)
    expect(items[0]?.quantity).toBe(3)

    const lineItemArg = stripeCreate.mock.calls[0]?.[0] as { line_items: Array<{ quantity: number }> }
    expect(lineItemArg.line_items).toHaveLength(1)
    expect(lineItemArg.line_items[0]?.quantity).toBe(3)

    expect(globals.responseStatuses).toContain(201)
  })

  it('achat multiple exact au stock disponible : la dernière unité verrouille le produit "reserved"', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 3, status: 'active' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 3 }] })

    const result = await handler({})

    const product = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    expect(product?.stock).toBe(0)
    expect(product?.status).toBe('reserved')
    expect(product?.reserved_order_id).toBe(result.orderId)
  })

  it('quantité demandée > stock disponible : 409 avant toute réservation (revalidation initiale)', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 2, status: 'active' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 3 }] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(supabase.tables.orders.rows).toHaveLength(0)
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it('course perdue en cours d\'achat multiple : rollback restitue TOUTES les unités déjà réservées de CE produit ET des AUTRES produits du panier', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 5, status: 'active' }))
    supabase.tables.products.rows.push(makeProductRow({
      id: PRODUCT_B_ID,
      slug: 'bottes-ariat',
      title: 'Bottes Ariat',
      price: 120,
      stock: 5,
      status: 'active',
    }))

    // Le produit A réussit intégralement ses 3 unités. Le produit B échoue
    // après 2 unités réservées sur les 4 demandées (course perdue en cours de
    // route sur CE produit, pas seulement au premier appel) — ce test échoue
    // si le mock/l'implémentation se contente de tout restituer "en gros" au
    // lieu de restituer EXACTEMENT les unités réellement réservées avant
    // l'échec, pour les DEUX produits.
    let productBCalls = 0
    const realRpc = supabase.rpc.bind(supabase)
    vi.spyOn(supabase, 'rpc').mockImplementation(async (fn: string, args: Record<string, string>) => {
      if (fn === 'reserve_product_unit' && args.p_product_id === PRODUCT_B_ID) {
        productBCalls++
        if (productBCalls > 2) return { data: [], error: null }
      }
      return realRpc(fn as never, args as never)
    })

    setBody({ items: [
      { productId: PRODUCT_A_ID, quantity: 3 },
      { productId: PRODUCT_B_ID, quantity: 4 },
    ] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })

    // Rollback ciblé et COMPLET : produit A entièrement restitué (3 unités),
    // produit B partiellement restitué (les 2 unités réellement réservées).
    const productA = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    expect(productA?.stock).toBe(5)
    expect(productA?.status).toBe('active')
    expect(productA?.reserved_order_id).toBeNull()

    const productB = supabase.tables.products.rows.find(p => p.id === PRODUCT_B_ID)
    expect(productB?.stock).toBe(5)
    expect(productB?.status).toBe('active')
    expect(productB?.reserved_order_id).toBeNull()

    expect(supabase.tables.orders.rows).toHaveLength(0)
    expect(supabase.tables.order_items.rows).toHaveLength(0)
    expect(stripeCreate).not.toHaveBeenCalled()
    expect(globals.responseStatuses).not.toContain(201)
  })

  it('quantité > 10 par ligne : rejeté par la validation zod avant tout accès Supabase', async () => {
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 11 }] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it('total d\'unités > 30 (plusieurs lignes) : rejeté par la validation zod, même si chaque ligne est ≤ 10', async () => {
    setBody({ items: [
      { productId: PRODUCT_A_ID, quantity: 10 },
      { productId: PRODUCT_B_ID, quantity: 10 },
      { productId: '00000000-0000-4000-8000-0000000000c3', quantity: 10 },
      { productId: '00000000-0000-4000-8000-0000000000d4', quantity: 1 },
    ] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it('course perdue sur un produit : rollback CIBLÉ des unités déjà réservées + 409, aucune session Stripe créée', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 1, status: 'active' }))
    supabase.tables.products.rows.push(makeProductRow({
      id: PRODUCT_B_ID,
      slug: 'bottes-ariat',
      title: 'Bottes Ariat',
      price: 120,
      stock: 1,
      status: 'active',
    }))

    // Simule la course perdue : la RPC `reserve_product_unit` échoue (0 ligne)
    // pour le produit B uniquement, quel que soit l'état de la table au
    // moment de l'appel (barrière atomique réelle non reproductible en JS
    // mono-thread — voir en-tête de fichier).
    const realRpc = supabase.rpc.bind(supabase)
    vi.spyOn(supabase, 'rpc').mockImplementation(async (fn: string, args: Record<string, string>) => {
      if (fn === 'reserve_product_unit' && args.p_product_id === PRODUCT_B_ID) {
        return { data: [], error: null }
      }
      return realRpc(fn as never, args as never)
    })

    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 1 }, { productId: PRODUCT_B_ID, quantity: 1 }] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })

    // Rollback ciblé : le produit A (réservé AVANT la course perdue sur B)
    // est restitué intégralement.
    const productA = supabase.tables.products.rows.find(p => p.id === PRODUCT_A_ID)
    expect(productA?.stock).toBe(1)
    expect(productA?.status).toBe('active')
    expect(productA?.reserved_order_id).toBeNull()

    // Produit B jamais réservé : stock inchangé.
    const productB = supabase.tables.products.rows.find(p => p.id === PRODUCT_B_ID)
    expect(productB?.stock).toBe(1)

    // Aucune commande orpheline, aucune session Stripe créée.
    expect(supabase.tables.orders.rows).toHaveLength(0)
    expect(supabase.tables.order_items.rows).toHaveLength(0)
    expect(stripeCreate).not.toHaveBeenCalled()
    expect(globals.responseStatuses).not.toContain(201)
  })

  it('article revalidé indisponible (stock épuisé ou statut non actif) : 409 avant toute réservation', async () => {
    supabase.tables.products.rows.push(makeProductRow({ id: PRODUCT_A_ID, stock: 0, status: 'sold' }))
    setBody({ items: [{ productId: PRODUCT_A_ID, quantity: 1 }] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 409 })
    expect(supabase.tables.orders.rows).toHaveLength(0)
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it('panier vide : rejeté par la validation zod avant tout accès Supabase', async () => {
    setBody({ items: [] })

    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(stripeCreate).not.toHaveBeenCalled()
  })
})

/**
 * US-097 — Tests unitaires de la route publique d'inscription
 * `server/api/products/[id]/notify-restock.post.ts` : idempotence sur le
 * couple (product_id, email), comportement pour un produit non en rupture,
 * validation email.
 *
 * `defineEventHandler` doit être stubbé (passthrough) AVANT l'import du
 * module de la route (elle s'exécute au chargement du module) — d'où
 * l'`import()` dynamique en `beforeAll`, comme les autres specs de routes.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Tables } from '~/types/database.types'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

const PRODUCT_ID = '00000000-0000-4000-8000-000000000020'

function makeProductRow(overrides: Partial<Tables<'products'>> = {}): Tables<'products'> {
  return {
    id: PRODUCT_ID,
    slug: 'selle-western-prestige',
    title: 'Selle western Prestige',
    description: 'Selle en excellent état',
    price: 1250,
    category: 'selles',
    brand: 'Circle Y',
    size: '17"',
    condition: 'excellent',
    is_consignment: false,
    consignment_id: null,
    status: 'active',
    reserved_order_id: null,
    reserved_until: null,
    images: [],
    stock: 0,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('POST /api/products/[id]/notify-restock', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase
  let handler: (event: unknown) => Promise<{ success: boolean }>

  beforeAll(async () => {
    globals = stubServerGlobals()
    const mod = await import('../../server/api/products/[id]/notify-restock.post')
    handler = mod.default as unknown as typeof handler
  })

  afterAll(() => {
    globals.restore()
  })

  beforeEach(() => {
    supabase = new FakeSupabase()
    globals.supabase = supabase
    globals.routerParams = { id: PRODUCT_ID }
  })

  it('crée une inscription pour un produit réellement en rupture', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 0, status: 'active' }))
    globals.body = { email: 'client@example.com' }

    const result = await handler({})

    expect(result).toEqual({ success: true })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(1)
    expect(supabase.tables.stock_notifications.rows[0]).toMatchObject({
      product_id: PRODUCT_ID,
      email: 'client@example.com',
      notified_at: null,
    })
  })

  it('idempotence (Gherkin 4) : une 2e soumission du même couple produit+email ne crée pas de doublon', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 0, status: 'active' }))
    globals.body = { email: 'client@example.com' }

    await handler({})
    const firstResult = await handler({})

    expect(firstResult).toEqual({ success: true })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(1)
  })

  it('idempotence : email avec casse/espaces différents reste le MÊME inscrit (normalisation)', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 0, status: 'active' }))
    globals.body = { email: 'Client@Example.com' }
    await handler({})

    globals.body = { email: '  client@example.com  ' }
    await handler({})

    expect(supabase.tables.stock_notifications.rows).toHaveLength(1)
  })

  it('produit non en rupture (stock > 0) : aucune inscription créée, réponse neutre identique', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 5, status: 'active' }))
    globals.body = { email: 'client@example.com' }

    const result = await handler({})

    expect(result).toEqual({ success: true })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(0)
  })

  it('produit de consignation à stock=0 : jamais considéré "en rupture" (axe orthogonal), aucune inscription', async () => {
    supabase.tables.products.rows.push(
      makeProductRow({ stock: 0, status: 'active', is_consignment: true }),
    )
    globals.body = { email: 'client@example.com' }

    const result = await handler({})

    expect(result).toEqual({ success: true })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(0)
  })

  it('produit vendu (status sold) à stock=0 : pas considéré "en rupture", aucune inscription', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 0, status: 'sold' }))
    globals.body = { email: 'client@example.com' }

    const result = await handler({})

    expect(result).toEqual({ success: true })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(0)
  })

  it('email invalide : rejeté avec 422, aucune inscription créée', async () => {
    supabase.tables.products.rows.push(makeProductRow({ stock: 0, status: 'active' }))
    globals.body = { email: 'pas-un-email' }

    await expect(handler({})).rejects.toMatchObject({ statusCode: 422 })
    expect(supabase.tables.stock_notifications.rows).toHaveLength(0)
  })

  it('produit introuvable : 404', async () => {
    globals.body = { email: 'client@example.com' }

    await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
  })
})

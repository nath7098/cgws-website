/**
 * US-097 — Tests unitaires de la détection de réapprovisionnement
 * (server/utils/stockNotifications.ts), extraite de la route admin
 * `server/api/admin/products/[id].put.ts` pour rester testable indépendamment
 * de la logique multipart/upload de cette dernière (même approche que
 * `server/utils/fulfillment.ts`, US-091).
 *
 * Aucun appel réseau : Supabase et Resend sont intégralement mockés.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { Tables } from '~/types/database.types'
import { sendRestockNotification } from '~~/server/services/email'
import { notifyRestockedSubscribers } from '../../server/utils/stockNotifications'
import { FakeSupabase } from './helpers/fakeSupabase'
import { stubServerGlobals } from './helpers/testGlobals'

// Hoisté par Vitest au-dessus de tous les imports — placé après pour l'ordre
// `import/first` (même remarque que fulfillment.spec.ts).
vi.mock('~~/server/services/email', () => ({
  sendRestockNotification: vi.fn().mockResolvedValue(undefined),
}))

const PRODUCT_ID = '00000000-0000-4000-8000-000000000010'

function makeSubscriptionRow(
  overrides: Partial<Tables<'stock_notifications'>> = {},
): Tables<'stock_notifications'> {
  return {
    id: '00000000-0000-4000-8000-000000000011',
    product_id: PRODUCT_ID,
    email: 'client@example.com',
    created_at: '2026-07-01T00:00:00.000Z',
    notified_at: null,
    ...overrides,
  }
}

describe('notifyRestockedSubscribers', () => {
  let globals: ReturnType<typeof stubServerGlobals>
  let supabase: FakeSupabase

  beforeEach(() => {
    globals = stubServerGlobals()
    globals.config = { resendApiKey: 'test_resend_key', public: { siteUrl: 'https://cgws.fr' } }
    supabase = new FakeSupabase()
    globals.supabase = supabase
    vi.mocked(sendRestockNotification).mockClear()
  })

  afterEach(() => {
    globals.restore()
  })

  it('envoie un email à CHAQUE inscrit non encore notifié et marque notified_at', async () => {
    supabase.tables.stock_notifications.rows.push(
      makeSubscriptionRow({ id: '00000000-0000-4000-8000-000000000011', email: 'a@example.com' }),
      makeSubscriptionRow({ id: '00000000-0000-4000-8000-000000000012', email: 'b@example.com' }),
    )

    await notifyRestockedSubscribers({
      productId: PRODUCT_ID,
      productTitle: 'Selle western Prestige',
      productSlug: 'selle-western-prestige',
      previousStock: 0,
      newStock: 5,
    })

    expect(sendRestockNotification).toHaveBeenCalledTimes(2)
    const recipients = (sendRestockNotification as Mock).mock.calls.map(
      call => (call[1] as { recipientEmail: string }).recipientEmail,
    )
    expect(recipients.sort()).toEqual(['a@example.com', 'b@example.com'])

    // Lien direct vers la fiche produit (Gherkin US-097).
    const payload = (sendRestockNotification as Mock).mock.calls[0]?.[1] as { productUrl: string }
    expect(payload.productUrl).toBe('https://cgws.fr/catalogue/selle-western-prestige')

    for (const row of supabase.tables.stock_notifications.rows) {
      expect(row.notified_at).not.toBeNull()
    }
  })

  it('ne notifie PAS un inscrit déjà marqué notified_at (pas de rappel en boucle à un ajustement ultérieur)', async () => {
    supabase.tables.stock_notifications.rows.push(
      makeSubscriptionRow({ notified_at: '2026-06-01T00:00:00.000Z' }),
    )

    await notifyRestockedSubscribers({
      productId: PRODUCT_ID,
      productTitle: 'Selle western Prestige',
      productSlug: 'selle-western-prestige',
      previousStock: 0,
      newStock: 3,
    })

    expect(sendRestockNotification).not.toHaveBeenCalled()
  })

  it('aucune inscription pour ce produit : aucun email envoyé, aucune erreur (Gherkin 6)', async () => {
    await expect(
      notifyRestockedSubscribers({
        productId: PRODUCT_ID,
        productTitle: 'Selle western Prestige',
        productSlug: 'selle-western-prestige',
        previousStock: 0,
        newStock: 4,
      }),
    ).resolves.toBeUndefined()

    expect(sendRestockNotification).not.toHaveBeenCalled()
  })

  it('ne déclenche rien si le produit n\'était PAS en rupture (previousStock > 0)', async () => {
    supabase.tables.stock_notifications.rows.push(makeSubscriptionRow())

    await notifyRestockedSubscribers({
      productId: PRODUCT_ID,
      productTitle: 'Selle western Prestige',
      productSlug: 'selle-western-prestige',
      previousStock: 2,
      newStock: 5,
    })

    expect(sendRestockNotification).not.toHaveBeenCalled()
    expect(supabase.tables.stock_notifications.rows[0]?.notified_at).toBeNull()
  })

  it('ne déclenche rien si le stock reste à 0 (aucun réapprovisionnement réel)', async () => {
    supabase.tables.stock_notifications.rows.push(makeSubscriptionRow())

    await notifyRestockedSubscribers({
      productId: PRODUCT_ID,
      productTitle: 'Selle western Prestige',
      productSlug: 'selle-western-prestige',
      previousStock: 0,
      newStock: 0,
    })

    expect(sendRestockNotification).not.toHaveBeenCalled()
  })

  it('non bloquant : une erreur Resend/imprévue ne remonte jamais à l\'appelant', async () => {
    supabase.tables.stock_notifications.rows.push(makeSubscriptionRow())
    vi.mocked(sendRestockNotification).mockRejectedValueOnce(new Error('Resend down'))

    await expect(
      notifyRestockedSubscribers({
        productId: PRODUCT_ID,
        productTitle: 'Selle western Prestige',
        productSlug: 'selle-western-prestige',
        previousStock: 0,
        newStock: 1,
      }),
    ).resolves.toBeUndefined()
  })

  it('ignore les inscriptions notified_at=null d\'un AUTRE produit', async () => {
    const otherProductId = '00000000-0000-4000-8000-000000000099'
    supabase.tables.stock_notifications.rows.push(
      makeSubscriptionRow({ product_id: otherProductId, email: 'autre@example.com' }),
    )

    await notifyRestockedSubscribers({
      productId: PRODUCT_ID,
      productTitle: 'Selle western Prestige',
      productSlug: 'selle-western-prestige',
      previousStock: 0,
      newStock: 2,
    })

    expect(sendRestockNotification).not.toHaveBeenCalled()
  })
})

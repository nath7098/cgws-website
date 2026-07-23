/**
 * Régression QA (US-096) — l'email de confirmation de commande
 * (`sendOrderConfirmationEmail`, server/services/email.ts) portait un
 * `quantity: 1` figé côté appelant (server/utils/fulfillment.ts) ET son
 * template HTML ignorait complètement le champ `quantity` de
 * `OrderConfirmationEmailData` (il n'affichait que `item.title`/`item.price`,
 * jamais multiplié par la quantité) — un achat multiple recevait donc un
 * email de confirmation affichant la mauvaise quantité ET le mauvais montant
 * de ligne, alors même que le sous-total/total globaux étaient corrects.
 *
 * Ce fichier exerce `sendOrderConfirmationEmail` de bout en bout (le SDK
 * Resend est mocké, pas le rendu HTML) pour prouver que le HTML envoyé
 * reflète réellement la quantité — un test qui se contenterait de vérifier
 * les arguments reçus par un `sendOrderConfirmationEmail` mocké (comme dans
 * tests/unit/fulfillment.spec.ts) n'aurait PAS détecté le bug du template.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubServerGlobals } from './helpers/testGlobals'

interface FakeResendSendResult {
  data: { id: string } | null
  error: { name: string, message: string } | null
}

const sendMock = vi.fn(async (): Promise<FakeResendSendResult> => ({
  data: { id: 'email_test_1' },
  error: null,
}))

// Doit être une vraie classe (pas une factory fléchée) : `email.ts` construit
// le client via `new Resend(apiKey)`, et `new (() => ...)` n'est pas
// constructible en JS.
class FakeResend {
  emails = { send: sendMock }
}

vi.mock('resend', () => ({
  Resend: FakeResend,
}))

describe('sendOrderConfirmationEmail — rendu HTML de la quantité (US-096)', () => {
  let globals: ReturnType<typeof stubServerGlobals>

  beforeEach(() => {
    globals = stubServerGlobals()
    globals.config = { emailFrom: 'CGWS <contact@cgws.fr>' }
    sendMock.mockClear()
  })

  afterEach(() => {
    globals.restore()
  })

  it('achat multiple (quantity=3) : le HTML affiche "× 3" et le TOTAL de ligne (prix unitaire × quantité), pas le prix unitaire seul', async () => {
    const { sendOrderConfirmationEmail } = await import('../../server/services/email')

    await sendOrderConfirmationEmail('test_api_key', {
      customerName: 'Jean Dupont',
      customerEmail: 'buyer@example.com',
      orderId: '00000000-0000-4000-8000-000000000001',
      items: [{ title: 'Huile de sabot', price: 18, quantity: 3 }],
      subtotal: 54,
      shippingCost: 0,
      total: 54,
      fulfillmentMethod: 'pickup',
    })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0]?.[0] as { html: string }

    expect(payload.html).toContain('Huile de sabot × 3')
    // Montant de ligne = 18 × 3 = 54 (formaté fr-FR, espace insécable variable
    // selon l'ICU du runtime — on ne teste que les chiffres/virgule).
    expect(payload.html).toContain('54,00')
    // Un template qui ignorerait `quantity` (bug corrigé) afficherait le prix
    // UNITAIRE seul (18,00) au lieu du total de ligne (54,00).
    expect(payload.html).not.toContain('18,00')
  })

  it('quantité par défaut (quantity=1) : aucun suffixe "× 1", rendu strictement inchangé', async () => {
    const { sendOrderConfirmationEmail } = await import('../../server/services/email')

    await sendOrderConfirmationEmail('test_api_key', {
      customerName: 'Jean Dupont',
      customerEmail: 'buyer@example.com',
      orderId: '00000000-0000-4000-8000-000000000002',
      items: [{ title: 'Selle western Prestige', price: 1850, quantity: 1 }],
      subtotal: 1850,
      shippingCost: 0,
      total: 1850,
      fulfillmentMethod: 'pickup',
    })

    const payload = sendMock.mock.calls[0]?.[0] as { html: string }
    expect(payload.html).toContain('>Selle western Prestige<')
    expect(payload.html).not.toContain('× 1')
    // Séparateur de milliers fr-FR = espace insécable étroite (U+202F), pas
    // un espace normal — on ne teste que les chiffres/virgule pour rester
    // robuste au caractère exact utilisé par l'ICU du runtime.
    expect(payload.html).toMatch(/1\s850,00/)
  })
})

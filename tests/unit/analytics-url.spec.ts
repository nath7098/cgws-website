import { describe, expect, it } from 'vitest'
import type { CaptureResult } from 'posthog-js'
import { sanitizeAnalyticsEvent, stripQueryAndHash } from '~/utils/analytics'

// ─── stripQueryAndHash — neutralisation query string + fragment ────────────────

describe('stripQueryAndHash', () => {
  it('supprime le jeton d\'auth Supabase du callback déposant', () => {
    expect(stripQueryAndHash('/espace-deposant/callback?token_hash=xyz&type=magiclink'))
      .toBe('/espace-deposant/callback')
    expect(stripQueryAndHash('/espace-deposant/callback?code=pkce-code'))
      .toBe('/espace-deposant/callback')
  })

  it('supprime la référence de session Stripe du checkout', () => {
    expect(stripQueryAndHash('/checkout/success?session_id=cs_test_123'))
      .toBe('/checkout/success')
  })

  it('supprime le fragment (flow implicite Supabase : #access_token=…)', () => {
    expect(stripQueryAndHash('/espace-deposant/callback#access_token=jwt&refresh_token=r'))
      .toBe('/espace-deposant/callback')
  })

  it('supprime query ET fragment sur une URL absolue', () => {
    expect(stripQueryAndHash('https://cgws.fr/checkout/success?session_id=cs_1#state'))
      .toBe('https://cgws.fr/checkout/success')
  })

  it('coupe au premier des deux marqueurs, même si # précède ?', () => {
    expect(stripQueryAndHash('https://cgws.fr/p#frag?pas-une-query'))
      .toBe('https://cgws.fr/p')
  })

  it('laisse intacte une URL sans query ni fragment', () => {
    expect(stripQueryAndHash('https://cgws.fr/catalogue')).toBe('https://cgws.fr/catalogue')
    expect(stripQueryAndHash('/catalogue')).toBe('/catalogue')
    expect(stripQueryAndHash('')).toBe('')
  })
})

// ─── sanitizeAnalyticsEvent — hook before_send (tous les événements) ───────────

function makeEvent(overrides: Partial<CaptureResult> = {}): CaptureResult {
  return {
    uuid: '00000000-0000-4000-8000-000000000001',
    event: '$pageview',
    properties: {},
    ...overrides,
  }
}

describe('sanitizeAnalyticsEvent', () => {
  it('laisse passer null (événement abandonné en amont)', () => {
    expect(sanitizeAnalyticsEvent(null)).toBeNull()
  })

  it('réécrit $current_url sans query string sur un $pageview', () => {
    const event = makeEvent({
      properties: {
        $current_url: 'https://cgws.fr/checkout/success?session_id=cs_test_123',
        $pathname: '/checkout/success',
      },
    })

    const result = sanitizeAnalyticsEvent(event)

    expect(result?.properties.$current_url).toBe('https://cgws.fr/checkout/success')
  })

  it('réécrit $current_url et $referrer sur un événement custom (US-103/104)', () => {
    const event = makeEvent({
      event: 'cta_clicked',
      properties: {
        $current_url: 'https://cgws.fr/espace-deposant/callback?token_hash=xyz&type=magiclink',
        $referrer: 'https://cgws.fr/espace-deposant?utm_source=mail',
        placement: 'hero',
      },
    })

    const result = sanitizeAnalyticsEvent(event)

    expect(result?.properties.$current_url).toBe('https://cgws.fr/espace-deposant/callback')
    expect(result?.properties.$referrer).toBe('https://cgws.fr/espace-deposant')
  })

  it('couvre toute clé porteuse d\'URL ($set / $set_once inclus)', () => {
    const event = makeEvent({
      properties: {
        $session_entry_url: 'https://cgws.fr/checkout/success?session_id=cs_1',
        $client_session_initial_pathname: '/checkout/success?session_id=cs_1',
      },
      $set: { $initial_referrer: 'https://cgws.fr/?fbclid=abc' },
      $set_once: { $initial_current_url: 'https://cgws.fr/espace-deposant/callback?code=pkce' },
    })

    const result = sanitizeAnalyticsEvent(event)

    expect(result?.properties.$session_entry_url).toBe('https://cgws.fr/checkout/success')
    expect(result?.properties.$client_session_initial_pathname).toBe('/checkout/success')
    expect(result?.$set?.$initial_referrer).toBe('https://cgws.fr/')
    expect(result?.$set_once?.$initial_current_url)
      .toBe('https://cgws.fr/espace-deposant/callback')
  })

  it('ne touche ni aux propriétés métier ni aux valeurs non-string', () => {
    const event = makeEvent({
      event: 'product_viewed',
      properties: {
        category: 'selles?fausse-query',
        price: 1850,
        image_url: 42,
      },
    })

    const result = sanitizeAnalyticsEvent(event)

    expect(result?.properties.category).toBe('selles?fausse-query')
    expect(result?.properties.price).toBe(1850)
    expect(result?.properties.image_url).toBe(42)
  })
})

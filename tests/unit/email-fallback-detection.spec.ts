/**
 * US-094 — Détection du fallback d'expéditeur email.
 *
 * Couvre uniquement `isFallbackSender()` (server/services/email.ts), seule
 * fonction exportée pour ce besoin — pas de test réseau Resend (déjà hors
 * scope, cf. tests/unit/fulfillment.spec.ts qui mocke intégralement l'envoi).
 *
 * `useRuntimeConfig` est un auto-import Nitro (global, jamais importé
 * explicitement dans `server/services/email.ts`) : on le stub via
 * `stubServerGlobals()`, comme le reste des tests `tests/unit/*.spec.ts`
 * ciblant du code serveur sans démarrer Nuxt/Nitro. `email.ts` ne contient
 * aucun `defineEventHandler` exécuté au chargement du module (contrairement
 * aux routes `server/api/**`) : un import statique classique suffit, la
 * config n'étant lue qu'à l'APPEL de `isFallbackSender()`, pas à l'import.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isFallbackSender } from '../../server/services/email'
import { stubServerGlobals } from './helpers/testGlobals'

describe('isFallbackSender', () => {
  let globals: ReturnType<typeof stubServerGlobals>

  beforeEach(() => {
    globals = stubServerGlobals()
  })

  afterEach(() => {
    globals.restore()
  })

  it('retourne true quand CGWS_EMAIL_FROM (emailFrom) est vide', () => {
    globals.config = { emailFrom: '' }

    expect(isFallbackSender()).toBe(true)
  })

  it('retourne true quand emailFrom est undefined', () => {
    globals.config = {}

    expect(isFallbackSender()).toBe(true)
  })

  it('retourne true quand emailFrom vaut explicitement le fallback Resend de test', () => {
    globals.config = { emailFrom: 'CGWS <onboarding@resend.dev>' }

    expect(isFallbackSender()).toBe(true)
  })

  it('retourne false quand emailFrom pointe vers un domaine vérifié', () => {
    globals.config = { emailFrom: 'CGWS <noreply@cgws.fr>' }

    expect(isFallbackSender()).toBe(false)
  })
})

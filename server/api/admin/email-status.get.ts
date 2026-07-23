import type { H3Event } from 'h3'
import { isFallbackSender } from '~~/server/services/email'

// ---------------------------------------------------------------------------
// US-094 — Statut de l'expéditeur email, réservé à l'admin authentifiée.
// Retourne UNIQUEMENT un booléen : jamais `runtimeConfig` brut, jamais
// l'adresse `from` elle-même (cf. critère Gherkin 3 : aucune info de
// configuration email exposée à un non-authentifié — et par prudence, pas
// davantage à l'admin elle-même au-delà du strict nécessaire à la bannière).
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  return { isFallback: isFallbackSender() }
})

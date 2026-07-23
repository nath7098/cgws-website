/**
 * Plugin PostHog cookieless — client only, différé, strictement anonyme (US-102).
 *
 * Cadrage NON négociable (exemption CNIL mesure d'audience, pas de bandeau de
 * consentement) :
 * - `persistence: 'memory'`   → AUCUN cookie ni localStorage/sessionStorage,
 *                               identité éphémère par session de navigation.
 * - `person_profiles: 'never'`→ aucun profil personne créé, tous les événements
 *                               sont anonymes ($process_person_profile: false).
 * - JAMAIS d'appel `identify()` dans le codebase.
 * - Session recording, heatmaps et surveys explicitement désactivés.
 * - `autocapture: false`      → taxonomie exclusivement explicite (US-103),
 *                               aucune PII aspirée depuis le DOM.
 * - Hébergement UE (https://eu.i.posthog.com) + option projet PostHog
 *   « Discard client IP data » (action Nathan, cf. docs/DEV_GUIDE.md).
 *
 * Chargement : import dynamique dans `onNuxtReady` (après hydratation, en
 * requestIdleCallback) — posthog-js n'est ni dans le bundle d'entrée ni sur le
 * chemin critique (aucun impact LCP/TBT). Sans clé, aucun script n'est chargé.
 */
export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public

  // Pas de clé (dev local, preview sans secret) : no-op silencieux —
  // useAnalytics() reste inerte, aucune erreur console.
  if (!posthogKey) return

  // Résolu de façon synchrone dans le setup du plugin (contexte Nuxt garanti).
  const router = useRouter()

  onNuxtReady(async () => {
    // try/catch global : si l'import du chunk ou l'init échoue (réseau,
    // adblocker…), aucune unhandled promise rejection — le site vit sans
    // analytics.
    try {
      const { default: posthog } = await import('posthog-js')

      const instance = posthog.init(posthogKey, {
        api_host: posthogHost,
        // Anonymat strict — aucun stockage navigateur, aucun profil personne.
        persistence: 'memory',
        person_profiles: 'never',
        // Taxonomie explicite uniquement (US-103) : pas d'autocapture DOM.
        autocapture: false,
        // Pageviews capturés manuellement sur le router (SPA), cf. ci-dessous.
        capture_pageview: false,
        capture_pageleave: false,
        // Fonctionnalités écartées par le cadrage (pas de replay ni heatmaps).
        disable_session_recording: true,
        capture_heatmaps: false,
        disable_surveys: true,
        // Aucun script additionnel lazy-loadé (recorder, surveys, toolbar…).
        disable_external_dependency_loading: true,
        // Neutralise query string + fragment de toute propriété porteuse
        // d'URL ($current_url, $referrer…) sur TOUS les événements : les
        // jetons sensibles (?code=, ?token_hash=, ?session_id=cs_…) ne
        // quittent jamais le navigateur (cf. app/utils/analytics.ts).
        before_send: sanitizeAnalyticsEvent,
      })

      // $pageview de la page d'entrée : router.afterEach ne rejoue pas la
      // navigation initiale (déjà terminée au moment de l'init différée).
      // L'URL passe par before_send → query/fragment supprimés.
      instance.capture('$pageview')

      // Pageviews SPA : la capture automatique ne couvre pas les navigations
      // client Nuxt → capture manuelle à chaque changement de route.
      router.afterEach(() => {
        instance.capture('$pageview')
      })

      // Branche useAnalytics() (flush du buffer pré-init).
      setAnalyticsClient(instance)
    }
    catch (error) {
      // Échec de chargement/init analytics : silencieux en production,
      // visible en dev uniquement.
      if (import.meta.dev) {
        console.warn('[posthog] init skipped:', error)
      }
    }
  })
})

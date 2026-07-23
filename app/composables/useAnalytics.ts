/**
 * useAnalytics — point d'entrée UNIQUE des événements analytics côté client (US-102).
 *
 * Les US-103/104 ne doivent JAMAIS importer posthog-js directement : tout passe
 * par `useAnalytics().capture(event, properties)`.
 *
 * Comportement :
 * - Sans clé PostHog (dev local, preview sans secret) : fonctions inertes,
 *   aucun script chargé, aucune erreur console (no-op silencieux).
 * - Avec clé : le plugin `app/plugins/posthog.client.ts` initialise PostHog de
 *   façon différée (onNuxtReady + idle) puis branche le client via
 *   `setAnalyticsClient()`. Les événements capturés avant l'init sont
 *   bufferisés (borné) et rejoués au branchement.
 * - Côté serveur : no-op strict (aucune référence à posthog-js n'est évaluée).
 */

export type AnalyticsPropertyValue = string | number | boolean | null | undefined

export type AnalyticsProperties = Record<
  string,
  AnalyticsPropertyValue | AnalyticsPropertyValue[]
>

/**
 * Contrat minimal du client analytics — structurellement satisfait par
 * l'instance posthog-js. Le composable ne dépend ainsi d'aucun type
 * posthog-js (zéro couplage, SSR-safe par construction).
 */
export interface AnalyticsClient {
  capture: (event: string, properties?: AnalyticsProperties) => unknown
}

interface QueuedEvent {
  event: string
  properties?: AnalyticsProperties
}

/** Borne du buffer pré-init : évite toute accumulation si la clé est absente. */
const MAX_QUEUED_EVENTS = 20

let client: AnalyticsClient | null = null
let queue: QueuedEvent[] = []

/**
 * Branche le client analytics une fois PostHog initialisé (appelé uniquement
 * par `app/plugins/posthog.client.ts`), et rejoue les événements bufferisés.
 * `null` débranche le client (utile pour les tests).
 */
export function setAnalyticsClient(instance: AnalyticsClient | null): void {
  client = instance
  if (instance) {
    const pending = queue
    queue = []
    for (const item of pending) {
      instance.capture(item.event, item.properties)
    }
  }
}

export function useAnalytics() {
  function capture(event: string, properties?: AnalyticsProperties): void {
    // SSR : no-op strict.
    if (import.meta.server) return

    if (client) {
      client.capture(event, properties)
      return
    }

    // Client pas (encore) branché : buffer borné, flush à l'init différée.
    // Sans clé PostHog, le buffer n'est jamais flush → no-op silencieux.
    if (queue.length < MAX_QUEUED_EVENTS) {
      queue.push(properties === undefined ? { event } : { event, properties })
    }
  }

  return { capture }
}

/**
 * useAnalytics — point d'entrée UNIQUE des événements analytics côté client (US-102).
 *
 * Les composants ne doivent JAMAIS importer posthog-js directement : tout passe
 * par `useAnalytics().capture(event, properties)`.
 *
 * Depuis l'US-103, `capture()` est verrouillé au niveau du compilateur sur la
 * taxonomie exhaustive de `app/utils/analytics-events.ts` : nom d'événement
 * hors liste ou propriétés hors taxonomie = erreur TypeScript.
 *
 * Comportement :
 * - Sans clé PostHog (dev local, preview sans secret) : fonctions inertes,
 *   aucun script chargé, aucune erreur console (no-op silencieux).
 * - Avec clé : le plugin `app/plugins/posthog.client.ts` initialise PostHog de
 *   façon différée (onNuxtReady + idle) puis branche le client via
 *   `setAnalyticsClient()`. Les événements capturés avant l'init sont
 *   bufferisés (borné) et rejoués au branchement, dans l'ordre.
 * - Côté serveur : no-op strict (aucune référence à posthog-js n'est évaluée).
 * - Résilience (US-103) : un client analytics qui lève (adblocker, réseau…)
 *   n'interrompt JAMAIS le parcours utilisateur — échec silencieux.
 */
import type {
  AnalyticsEventName,
  AnalyticsEventPayloadMap,
  AnalyticsEventWithProperties,
  AnalyticsEventWithoutProperties,
} from '~/utils/analytics-events'

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

/** Transmet au client sans jamais laisser une erreur remonter au parcours. */
function safeForward(target: AnalyticsClient, item: QueuedEvent): void {
  try {
    target.capture(item.event, item.properties)
  }
  catch {
    // La mesure échoue en silence, jamais l'expérience utilisateur.
  }
}

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
      safeForward(instance, item)
    }
  }
}

export function useAnalytics() {
  function capture(event: AnalyticsEventWithoutProperties): void
  function capture<E extends AnalyticsEventWithProperties>(
    event: E,
    properties: AnalyticsEventPayloadMap[E],
  ): void
  function capture(event: AnalyticsEventName, properties?: AnalyticsProperties): void {
    // SSR : no-op strict.
    if (import.meta.server) return

    if (client) {
      safeForward(client, properties === undefined ? { event } : { event, properties })
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

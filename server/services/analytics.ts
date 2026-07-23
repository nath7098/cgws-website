import { randomUUID } from 'node:crypto'

/**
 * Analytics serveur (US-104) — capture fiable de `order_paid` via posthog-node.
 *
 * SEUL point du code serveur autorisé à parler à PostHog. La taxonomie
 * SERVEUR est distincte de la taxonomie client (`app/utils/analytics-events.ts`,
 * qui reste exhaustive à 6 événements et verrouillée au compilateur) : un seul
 * événement serveur existe, déclaré ici comme constante — étendre la map
 * client aurait affaibli son invariant d'exhaustivité côté navigateur.
 *
 * Garanties :
 * - No-op silencieux sans `NUXT_PUBLIC_POSTHOG_KEY` (cohérent US-102) —
 *   posthog-node n'est même pas importé (import dynamique).
 * - Ne lève JAMAIS : tout échec (réseau, clé invalide, quota) est loggé et
 *   avalé — l'analytics ne casse jamais le fulfillment.
 * - Serverless-safe (Vercel) : `flushAt: 1` + `flushInterval: 0` (envoi
 *   immédiat à la capture, aucun batching différé) puis `_shutdown()` awaité
 *   (flush + attente des requêtes en vol + arrêt des timers) AVANT le retour —
 *   aucun événement perdu dans un buffer tué avec la lambda. NB : dans
 *   posthog-node v5.x installé, le shutdown gracieux public est `_shutdown()`
 *   (l'ancien `shutdown()` n'existe plus dans les types ni au runtime).
 * - Anonymat (cadrage RGPD US-102) : `$process_person_profile: false` (aucun
 *   profil personne créé côté PostHog), `disableGeoip: true` (l'IP vue par le
 *   webhook est celle des serveurs Stripe — la géolocaliser serait faux),
 *   AUCUNE PII dans les propriétés (jamais `customer_details`).
 */

/** Taxonomie serveur — exhaustive : tout événement hors liste est refusé en review. */
export const SERVER_ANALYTICS_EVENTS = {
  orderPaid: 'order_paid',
} as const

export interface OrderPaidCapture {
  /**
   * distinct_id anonyme éphémère transmis par le navigateur à la création de
   * session (metadata Stripe `analytics_id`) — raccorde le funnel client
   * (checkout_opened → order_paid) pour la session de navigation. `null` si
   * PostHog était bloqué/désactivé côté client : un id aléatoire est généré
   * pour que le comptage global reste exhaustif.
   */
  analyticsId: string | null
  /** Montant total encaissé, en euros (converti depuis `amount_total` Stripe). */
  amountTotal: number
  /** Devise Stripe (ex. `eur`). */
  currency: string
  /** Total d'unités de la commande (somme des quantités — sémantique US-096). */
  itemsCount: number
  /** Premier `payment_method_types` de la session, si disponible. */
  paymentMethodType: string | null
}

export async function captureOrderPaid(input: OrderPaidCapture): Promise<void> {
  const config = useRuntimeConfig()
  const posthogKey = (config.public.posthogKey as string | undefined)?.trim()
  if (!posthogKey) return

  try {
    const { PostHog } = await import('posthog-node')

    const client = new PostHog(posthogKey, {
      host: (config.public.posthogHost as string | undefined)?.trim() || 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })

    client.capture({
      distinctId: input.analyticsId ?? randomUUID(),
      event: SERVER_ANALYTICS_EVENTS.orderPaid,
      properties: {
        amount_total: input.amountTotal,
        currency: input.currency,
        items_count: input.itemsCount,
        ...(input.paymentMethodType ? { payment_method_type: input.paymentMethodType } : {}),
        // Événement anonyme : aucun profil personne côté PostHog (cadrage US-102).
        $process_person_profile: false,
      },
      disableGeoip: true,
    })

    await client._shutdown(3000)
  }
  catch (error) {
    // Non-bloquant par contrat : l'échec d'analytics n'affecte jamais le
    // fulfillment ni la réponse au webhook.
    console.error('[analytics] capture order_paid échouée (non bloquant) :', error)
  }
}

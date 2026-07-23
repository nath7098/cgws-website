/**
 * Nettoyage des URLs envoyées à PostHog (US-102, correctif QA).
 *
 * PostHog attache par défaut `$current_url` = `window.location.href` COMPLET
 * (query string et fragment inclus) à CHAQUE événement. Or certaines routes
 * portent des jetons sensibles en query/fragment :
 * - /espace-deposant/callback?code=... | ?token_hash=...&type=... (auth Supabase)
 * - /checkout/success?session_id=cs_... (session Stripe → commande/identité)
 *
 * Envoyer ces jetons au tiers contredirait l'anonymat revendiqué (mentions
 * légales / exemption CNIL). On neutralise donc query string ET fragment de
 * toute propriété porteuse d'URL, sur TOUS les événements, via le hook
 * `before_send` (seul point de passage couvrant $pageview ET les événements
 * custom des US-103/104 — `get_current_url` ne réécrit PAS `$current_url`,
 * et `sanitize_properties` est dépréciée au profit de `before_send`, cf.
 * @posthog/types).
 */
import type { CaptureResult } from 'posthog-js'

/**
 * Tronque une URL (absolue ou relative) à la première occurrence de `?` ou
 * `#` : la query string et le fragment sont intégralement supprimés.
 * Pas d'allowlist : aucune query n'est nécessaire à l'analytics de ce sprint.
 */
export function stripQueryAndHash(url: string): string {
  const markers = [url.indexOf('?'), url.indexOf('#')].filter(index => index !== -1)
  if (markers.length === 0) return url
  return url.slice(0, Math.min(...markers))
}

/**
 * Une clé de propriété est considérée porteuse d'URL si elle se termine par
 * `url`, `pathname` ou `referrer` (insensible à la casse — couvre
 * `$current_url`, `$initial_current_url`, `$session_entry_url`,
 * `$client_session_initial_pathname`, `$referrer`, `$initial_referrer`…
 * y compris de futures propriétés PostHog).
 */
function isUrlBearingKey(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.endsWith('url') || lower.endsWith('pathname') || lower.endsWith('referrer')
}

function sanitizeUrlProperties(bag: Record<string, unknown>): void {
  for (const key of Object.keys(bag)) {
    const value = bag[key]
    if (typeof value === 'string' && isUrlBearingKey(key)) {
      bag[key] = stripQueryAndHash(value)
    }
  }
}

/**
 * Hook `before_send` PostHog : réécrit toutes les propriétés porteuses d'URL
 * de l'événement (properties, $set, $set_once) sans query string ni fragment.
 * S'applique à TOUS les événements capturés (pageviews et événements custom).
 */
export function sanitizeAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event
  sanitizeUrlProperties(event.properties)
  if (event.$set) sanitizeUrlProperties(event.$set)
  if (event.$set_once) sanitizeUrlProperties(event.$set_once)
  return event
}

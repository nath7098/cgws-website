import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Returns a lazily-instantiated Stripe client from runtimeConfig.
 * Lazy singleton (pattern recommandé stripe-node) : évite d'instancier le SDK
 * au chargement du module quand la clé n'est pas encore disponible (build).
 *
 * Pas d'`apiVersion` explicite : le SDK épingle lui-même la version d'API
 * correspondant à la release installée (comportement par défaut stripe-node).
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const config = useRuntimeConfig()
  const secretKey = (config.stripeSecretKey as string | undefined)?.trim()

  if (!secretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Paiement indisponible — configuration Stripe manquante',
    })
  }

  _stripe = new Stripe(secretKey)
  return _stripe
}

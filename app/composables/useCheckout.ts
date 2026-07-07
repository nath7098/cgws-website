import type { FetchError } from 'ofetch'
import type { CheckoutPayload } from '~/types'

interface UnavailableProduct {
  id: string
  title: string
}

/** Corps d'erreur H3 sérialisé — `data` porte le détail métier (409). */
interface CheckoutErrorBody {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: {
    unavailable?: UnavailableProduct[]
  }
}

/**
 * Orchestration client du checkout (US-071) : POST vers l'API de création de
 * session Stripe Checkout puis redirection plein-page vers l'URL hébergée
 * Stripe (`window.location.href`) — aucune clé publishable côté client.
 */
export function useCheckout() {
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  /** Produits refusés par la revalidation serveur (409) — plus disponibles. */
  const unavailableProducts = ref<UnavailableProduct[]>([])

  async function submitCheckout(payload: CheckoutPayload): Promise<boolean> {
    loading.value = true
    errorMessage.value = null
    unavailableProducts.value = []

    try {
      const response = await $fetch<{ url: string }>('/api/checkout/session', {
        method: 'POST',
        body: payload,
      })

      if (import.meta.client) {
        window.location.href = response.url
      }
      // `loading` reste true pendant la navigation vers Stripe — c'est voulu,
      // le bouton reste en état "chargement" jusqu'au départ de la page.
      return true
    }
    catch (err) {
      const fetchError = err as FetchError<CheckoutErrorBody>
      const body = fetchError.data

      if (fetchError.statusCode === 409 && body?.data?.unavailable?.length) {
        unavailableProducts.value = body.data.unavailable
        errorMessage.value
          = 'Certains articles de votre panier ne sont plus disponibles. Retirez-les pour continuer.'
      }
      else if (fetchError.statusCode === 422) {
        errorMessage.value
          = body?.statusMessage ?? 'Certaines informations sont invalides. Vérifiez le formulaire.'
      }
      else {
        errorMessage.value
          = 'Impossible de démarrer le paiement pour le moment. Réessayez dans quelques instants.'
      }
      loading.value = false
      return false
    }
  }

  return { loading, errorMessage, unavailableProducts, submitCheckout }
}

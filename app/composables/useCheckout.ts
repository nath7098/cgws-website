import type { FetchError } from 'ofetch'
import type { CheckoutPayload } from '~/types'
import { useCartStore } from '~/stores/cart'

interface UnavailableProduct {
  id: string
  title: string
}

interface CheckoutSessionResponse {
  clientSecret: string
  orderId: string
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
 * Orchestration client du checkout embarqué (rework E8) : POST vers l'API de
 * création de session Stripe Checkout (`ui_mode: 'embedded_page'`) puis retour
 * du `clientSecret` au caller, qui le fournit à `stripe.initEmbeddedCheckout`.
 * Aucune redirection plein-page : le formulaire de paiement est monté dans
 * /checkout.
 */
export function useCheckout() {
  const cart = useCartStore()
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  /** Produits refusés par la revalidation serveur (409) — plus disponibles. */
  const unavailableProducts = ref<UnavailableProduct[]>([])

  /**
   * Crée la session Checkout embarquée. Mémorise `orderId` dans le panier
   * (pour pouvoir libérer sa réservation si l'acheteur abandonne) AVANT de
   * retourner le `clientSecret`, afin qu'une tentative concurrente/suivante
   * dispose toujours du bon `previousOrderId`.
   */
  async function createSession(payload: CheckoutPayload): Promise<string | null> {
    loading.value = true
    errorMessage.value = null
    unavailableProducts.value = []

    try {
      const response = await $fetch<CheckoutSessionResponse>('/api/checkout/session', {
        method: 'POST',
        body: payload,
      })

      cart.setPendingOrder(response.orderId)
      return response.clientSecret
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
          = body?.statusMessage ?? 'Certaines informations sont invalides. Vérifiez votre panier.'
      }
      else {
        errorMessage.value
          = 'Impossible de démarrer le paiement pour le moment. Réessayez dans quelques instants.'
      }
      return null
    }
    finally {
      loading.value = false
    }
  }

  return { loading, errorMessage, unavailableProducts, createSession }
}

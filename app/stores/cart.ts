import { ref, computed } from 'vue'
import { defineStore, skipHydrate } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { CartItem, Product } from '~/types'
import { addCartLine, removeCartLine, computeSubtotal } from '#shared/utils/checkout'
import { useSupabase } from '~/composables/useSupabase'

const CART_STORAGE_KEY = 'cgws-cart'
const PENDING_ORDER_KEY = 'cgws-pending-order'

function toCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    price: product.price,
    image: product.images[0] ?? null,
    size: product.size,
    addedAt: new Date().toISOString(),
  }
}

/**
 * Store panier (US-070).
 *
 * - Persistance localStorage via `useLocalStorage` (@vueuse) : SSR-safe — côté
 *   serveur la ref retombe sur la valeur par défaut `[]` sans toucher à
 *   `localStorage`. `skipHydrate` (pattern officiel Pinia "SSR + composables")
 *   empêche Pinia d'écraser au client la valeur lue dans le navigateur avec le
 *   state sérialisé côté serveur. L'affichage du compteur dans le header est
 *   enveloppé dans <ClientOnly> pour éviter tout hydration mismatch visuel.
 * - Pièces uniques : 1 ligne = 1 exemplaire, dé-duplication par productId
 *   (logique pure partagée dans #shared/utils/checkout, testée unitairement).
 */
export const useCartStore = defineStore('cart', () => {
  const items = skipHydrate(useLocalStorage<CartItem[]>(CART_STORAGE_KEY, [], { deep: true }))

  /** ID de la dernière commande `pending` créée pour ce panier. Persisté pour
   *  pouvoir libérer ses réservations si l'acheteur revient sur /checkout après
   *  avoir abandonné (il ne se bloque pas sur ses propres pièces). Vidé après
   *  paiement réussi (clear) ou remplacé à chaque nouvelle session. */
  const pendingOrderId = skipHydrate(useLocalStorage<string | null>(PENDING_ORDER_KEY, null))

  /** IDs des produits du panier devenus indisponibles (vendus/réservés/retirés
   *  entre-temps). Non persisté — recalculé via refreshAvailability(). */
  const unavailableIds = ref<string[]>([])

  const count = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)

  const availableItems = computed(() =>
    items.value.filter(item => !unavailableIds.value.includes(item.productId)),
  )
  const unavailableItems = computed(() =>
    items.value.filter(item => unavailableIds.value.includes(item.productId)),
  )

  /** Sous-total (€) — les articles indisponibles sont exclus du total. */
  const subtotal = computed(() => computeSubtotal(availableItems.value))

  function isInCart(productId: string): boolean {
    return items.value.some(item => item.productId === productId)
  }

  /**
   * Ajoute un produit au panier. Retourne `false` si le produit n'est pas
   * achetable (status ≠ active) ou déjà présent (pièce unique — pas de doublon).
   */
  function add(product: Product): boolean {
    if (product.status !== 'active') return false
    const next = addCartLine(items.value, toCartItem(product))
    if (next === items.value) return false
    items.value = next
    return true
  }

  function remove(productId: string): void {
    items.value = removeCartLine(items.value, productId)
    unavailableIds.value = unavailableIds.value.filter(id => id !== productId)
  }

  function clear(): void {
    items.value = []
    unavailableIds.value = []
    pendingOrderId.value = null
  }

  /** Mémorise (ou efface) la commande pending associée au panier courant. */
  function setPendingOrder(orderId: string | null): void {
    pendingOrderId.value = orderId
  }

  /**
   * Revalide la disponibilité de chaque article auprès de Supabase (lecture
   * publique). Un produit absent du résultat ou dont le status n'est plus
   * `active` est marqué indisponible. Silencieux en cas d'erreur réseau
   * (on garde le dernier état connu plutôt que de bloquer le panier).
   */
  async function refreshAvailability(): Promise<void> {
    if (items.value.length === 0) {
      unavailableIds.value = []
      return
    }
    const supabase = useSupabase()
    const ids = items.value.map(item => item.productId)
    const { data, error } = await supabase
      .from('products')
      .select('id, status')
      .in('id', ids)

    if (error || !data) return

    const activeIds = new Set(
      data.filter(row => row.status === 'active').map(row => row.id),
    )
    unavailableIds.value = ids.filter(id => !activeIds.has(id))
  }

  return {
    items,
    pendingOrderId,
    unavailableIds,
    count,
    isEmpty,
    availableItems,
    unavailableItems,
    subtotal,
    isInCart,
    add,
    remove,
    clear,
    setPendingOrder,
    refreshAvailability,
  }
})

import { ref, computed } from 'vue'
import { defineStore, skipHydrate } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { CartItem, Product } from '~/types'
import { addCartLine, removeCartLine, computeSubtotal } from '#shared/utils/checkout'
import { useSupabase } from '~/composables/useSupabase'

const CART_STORAGE_KEY = 'cgws-cart'
const PENDING_ORDER_KEY = 'cgws-pending-order'

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    price: product.price,
    image: product.images[0] ?? null,
    size: product.size,
    quantity,
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
 * - Toujours 1 ligne par produit (dé-duplication par productId, logique pure
 *   partagée dans #shared/utils/checkout, testée unitairement). Une ligne
 *   porte un champ `quantity` (US-096, achat multiple) : pour les pièces de
 *   consignation (isConsignment=true), la quantité reste toujours 1 — le
 *   sélecteur de quantité est masqué côté UI (pièce unique par nature) et le
 *   comportement de dé-duplication reste strictement celui d'avant l'US-096.
 * - `count` (badge panier header) compte le TOTAL D'UNITÉS (somme des
 *   quantités), pas le nombre de lignes — décision US-096 : c'est
 *   l'information la plus honnête pour « combien d'articles dans mon
 *   panier », cohérente avec la sémantique conventionnelle d'un panier
 *   e-commerce. ⚠️ `CartLineItem`/`CartDrawer` n'affichent aujourd'hui
 *   qu'un prix unitaire par ligne (pas de `qty × prix`, hors périmètre
 *   explicite de la spec design US-096-097 §0.2) : une ligne à quantité > 1
 *   fera donc apparaître un total de compteur cohérent mais un total de
 *   ligne visuellement non détaillé — dette connue, signalée au PO.
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

  /** Total d'unités (somme des quantités) — voir note de tête de fichier.
   *  `item.quantity ?? 1` : garde de migration — un panier localStorage posé
   *  AVANT l'US-096 contient des `CartItem` sans champ `quantity` du tout
   *  (`undefined`, pas juste absent du type) ; sans cette garde, `sum + undefined`
   *  propage `NaN` à travers tout le `reduce` et casse durablement le badge du
   *  header pour ce visiteur, jusqu'à ce qu'il vide manuellement son panier. */
  const count = computed(() => items.value.reduce((sum, item) => sum + (item.quantity ?? 1), 0))
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
   * Ajoute un produit au panier avec la quantité donnée (défaut 1 — pièces
   * uniques/consignation). Retourne `false` si le produit n'est pas achetable
   * (status ≠ active) OU si l'appel est un no-op — soit une pièce unique déjà
   * présente (comportement inchangé), soit une quantité identique à celle déjà
   * en panier. Retourne `true` sinon : première ligne ajoutée OU quantité
   * remplacée sur la ligne existante (US-096 — jamais de doublon de ligne, le
   * caller peut distinguer les deux cas via `isInCart()` avant l'appel).
   */
  function add(product: Product, quantity = 1): boolean {
    if (product.status !== 'active') return false
    const next = addCartLine(items.value, toCartItem(product, quantity))
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

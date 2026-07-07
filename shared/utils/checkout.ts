/**
 * Shared checkout/cart contract & pure business logic (US-070 / US-071).
 *
 * Single source of truth for the cart store (client), the checkout API routes
 * (server) and the unit tests. Lives in `shared/` so it is importable via
 * `#shared/utils/checkout` from both the Vue app and the Nitro server.
 *
 * Intentionally framework-free (no Vue, no Nuxt, no `~/types` import) so it
 * can be unit-tested with plain Vitest and imported from any build context.
 */

// ─── Constantes ────────────────────────────────────────────────────────────────

/**
 * Frais de port forfaitaires (€) pour la livraison à domicile.
 *
 * ⚠️ PLACEHOLDER — tarif à confirmer par Nathan/Camille avec un vrai devis
 * transporteur (une selle western pèse 10-20 kg, le forfait réel sera très
 * probablement différent et pourrait dépendre de la catégorie). Ne pas
 * considérer cette valeur comme définitive avant validation métier.
 */
export const SHIPPING_FLAT_RATE = 9.9

/** Retrait à la boutique de Brèches — toujours gratuit. */
export const PICKUP_COST = 0

export const FULFILLMENT_METHODS = ['shipping', 'pickup'] as const
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number]

export const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'fulfilled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const FULFILLMENT_LABELS: Record<FulfillmentMethod, string> = {
  shipping: 'Livraison à domicile',
  pickup: 'Retrait à la boutique (Brèches)',
}

// ─── Helpers monétaires ────────────────────────────────────────────────────────

/** Arrondit un montant à 2 décimales (centimes) sans dérive flottante. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** Convertit un montant en euros vers des centimes entiers (unité Stripe). */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}

// ─── Logique panier (pure) ─────────────────────────────────────────────────────

export interface CartLineLike {
  productId: string
  price: number
}

/**
 * Ajoute une ligne au panier en dé-dupliquant par `productId`.
 *
 * Les articles CGWS sont majoritairement des pièces uniques (stock = 1,
 * occasion/consignation) : une ligne de panier = un exemplaire, jamais de
 * quantité. Si le produit est déjà présent, le panier est retourné inchangé
 * (même référence de tableau — permet au caller de détecter le no-op).
 */
export function addCartLine<T extends { productId: string }>(
  items: readonly T[],
  line: T,
): T[] {
  if (items.some(item => item.productId === line.productId)) {
    return items as T[]
  }
  return [...items, line]
}

/** Retire une ligne du panier par `productId`. */
export function removeCartLine<T extends { productId: string }>(
  items: readonly T[],
  productId: string,
): T[] {
  return items.filter(item => item.productId !== productId)
}

/** Sous-total (€) d'une liste de lignes — 1 exemplaire par ligne. */
export function computeSubtotal(items: ReadonlyArray<{ price: number }>): number {
  return roundMoney(items.reduce((sum, item) => sum + item.price, 0))
}

/** Frais de port (€) selon le mode de réception choisi. */
export function computeShippingCost(method: FulfillmentMethod): number {
  return method === 'shipping' ? SHIPPING_FLAT_RATE : PICKUP_COST
}

/** Total commande (€) = sous-total + frais de port éventuels. */
export function computeTotal(subtotal: number, method: FulfillmentMethod): number {
  return roundMoney(subtotal + computeShippingCost(method))
}

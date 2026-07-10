import type { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '#shared/utils/csvImport'
import type { FULFILLMENT_METHODS, ORDER_STATUSES } from '#shared/utils/checkout'

export type ProductStatus = 'active' | 'sold' | 'reserved' | 'inactive'
export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest'

export interface CatalogueFilters {
  categories: ProductCategory[]
  conditions: Array<'new' | 'occasion'>
  brands: string[]
  priceMin: number
  priceMax: number
  includeReserved: boolean
  isConsignment: boolean | null
}
// Derived from the shared single source of truth (US-063) so the CSV import
// value sets and the domain unions can never diverge.
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
export type ConsignmentStatus = 'pending' | 'accepted' | 'rejected' | 'sold' | 'returned'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check'

// Status/label pill variants shared by CgwsBadge and consignment mappings (US-066)
export type BadgeVariant =
  | 'new'
  | 'occasion'
  | 'consignment'
  | 'sold'
  | 'rejected'
  | 'reserved'
  | 'pending'
  | 'accepted'

export interface Product {
  id: string
  slug: string
  title: string
  description: string
  price: number
  category: ProductCategory
  brand: string
  size?: string
  condition: ProductCondition
  isConsignment: boolean
  consignmentId?: string
  status: ProductStatus
  images: string[]
  stock: number
  createdAt: string
  updatedAt: string
}

export interface Consignment {
  id: string
  depositorName: string
  depositorEmail: string
  depositorPhone: string
  itemDescription: string
  brand: string
  condition: ProductCondition
  askingPrice: number
  agreedPrice?: number
  images: string[]
  status: ConsignmentStatus
  notes?: string
  createdAt: string
}

export interface Sale {
  id: string
  productId: string
  clientId?: string
  salePrice: number
  paymentMethod: PaymentMethod
  saleDate: string
  commissionAmount?: number
  notes?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
}

// ─── Depositor space (US-066) ─────────────────────────────────────────────────

// Strict subset of Consignment exposed to a depositor via
// GET /api/depositor/consignments. Structurally excludes internal `notes` and any
// raw commission field — the omission is by design, not merely hidden in a template.
export interface DepositorConsignmentView {
  id: string
  itemDescription: string
  brand: string
  condition: ProductCondition
  status: ConsignmentStatus
  askingPrice: number
  agreedPrice?: number
  /** Effective sale price — only present when status === 'sold'. */
  salePrice?: number
  /** Net amount owed to the depositor (sale price − commission), computed server-side. Only when 'sold'. */
  depositorAmount?: number
  createdAt: string
}

// ProductForm payload emitted on submit
export interface ProductFormPayload {
  fields: {
    title: string
    category: ProductCategory
    brand: string
    description: string
    price: number
    condition: ProductCondition
    size: string
    stock: number
    isConsignment: boolean
    consignmentId: string | null
    slug: string
    status?: ProductStatus
  }
  newImages: File[]
  keptImages: string[]
  removedImages: string[]
}

// Dashboard admin — sub-shapes used by KpiCard / RecentActivity
export interface RecentConsignment {
  id: string
  depositorName: string
  itemDescription: string
  status: ConsignmentStatus
  createdAt: string
}

export interface RecentSale {
  id: string
  productTitle: string
  salePrice: number
  paymentMethod: PaymentMethod
  saleDate: string
}

// ─── Categories (US-033) ──────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
}

export interface CategoryWithMeta extends Category {
  productCount: number
  children: CategoryWithMeta[]
}

export interface CategoryFormPayload {
  name: string
  slug: string
  parentId: string | null
  isActive: boolean
}

export interface ReorderPayload {
  items: Array<{ id: string; sortOrder: number; parentId: string | null }>
}

// ─── Status History (US-034) ──────────────────────────────────────────────────

export interface ProductStatusHistory {
  id: string
  productId: string
  oldStatus: ProductStatus | null
  newStatus: ProductStatus
  changedAt: string
  changedBy: string
}

export interface QuickSalePayload {
  productId: string
  salePrice: number
  saleDate: string
  paymentMethod: PaymentMethod
  clientId?: string | null
  clientName?: string
  notes?: string
}

// ─── Clients (US-042) ─────────────────────────────────────────────────────────

export interface ClientWithStats extends Client {
  purchaseCount: number
  lastPurchaseDate: string | null
}

export interface ClientPurchase {
  id: string
  productTitle: string
  productBrand: string
  salePrice: number
  paymentMethod: PaymentMethod
  saleDate: string
}

// ─── Panier & Checkout Stripe (US-070 / US-071) ───────────────────────────────

// Derived from the shared single source of truth (#shared/utils/checkout) so the
// cart store, the server routes and the domain unions can never diverge.
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number]
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Ligne de panier — snapshot d'affichage du produit au moment de l'ajout.
 *  1 ligne = 1 exemplaire (pièces uniques, pas de quantité). */
export interface CartItem {
  productId: string
  slug: string
  title: string
  brand: string
  price: number
  image: string | null
  size?: string
  addedAt: string
}

/**
 * `type` (et non `interface`) à dessein : les alias objet ont une signature
 * d'index implicite qui les rend structurellement assignables à `Json`
 * (colonne jsonb `orders.shipping_address`) — aucun cast nécessaire côté
 * fulfillment. Une interface ne l'est pas.
 */
export type ShippingAddress = {
  street: string
  postalCode: string
  city: string
  country: string
}

export interface OrderItem {
  id: string
  orderId: string
  /** null si le produit a été supprimé depuis (snapshot title/price conservé). */
  productId: string | null
  title: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  email: string
  customerName: string
  phone?: string
  fulfillmentMethod: FulfillmentMethod
  shippingAddress?: ShippingAddress
  status: OrderStatus
  subtotal: number
  shippingCost: number
  total: number
  currency: string
  stripeSessionId?: string
  stripePaymentIntent?: string
  clientId?: string
  createdAt: string
  updatedAt: string
}

/** Récapitulatif public renvoyé par GET /api/orders/[id] (page success).
 *  Volontairement restreint — pas de payment_intent ni de client_id.
 *  Les coordonnées (nom/email) et le mode de réception sont collectés par
 *  Stripe et rapatriés par le webhook : ils sont `null` tant que le paiement
 *  n'est pas confirmé (commande encore `pending`). */
export interface OrderRecap {
  id: string
  status: OrderStatus
  customerName: string | null
  email: string | null
  fulfillmentMethod: FulfillmentMethod | null
  shippingAddress: ShippingAddress | null
  subtotal: number
  shippingCost: number
  total: number
  items: Array<{ title: string, price: number, quantity: number }>
  createdAt: string
}

/** Payload POST /api/checkout/session (checkout embarqué invité, aucun compte).
 *  Les coordonnées et l'adresse ne sont plus saisies côté CGWS : Stripe les
 *  collecte dans le formulaire embarqué. On envoie uniquement les produits, et
 *  éventuellement la commande précédente à libérer (retour sur le panier après
 *  un abandon, pour ne pas se bloquer soi-même sur ses propres réservations). */
export interface CheckoutPayload {
  productIds: string[]
  previousOrderId?: string
}

/** Statut renvoyé par GET /api/checkout/session-status (page de retour).
 *  `status` = statut de la session Stripe, `paymentStatus` = état du paiement
 *  (valeurs Stripe natives ; `unpaid` + status `complete` = paiement asynchrone
 *  en cours de traitement). */
export interface CheckoutSessionStatus {
  status: 'open' | 'complete' | 'expired'
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
  order: OrderRecap | null
}

// ─── Reporting (US-043) ───────────────────────────────────────────────────────

export interface MonthlyRevenue {
  /** ISO month string — "YYYY-MM" */
  month: string
  /** Revenue from own (non-consignment) sales in € */
  ownRevenue: number
  /** Revenue from consignment sales in € */
  consignmentRevenue: number
}

import type { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '#shared/utils/csvImport'

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

// ─── Reporting (US-043) ───────────────────────────────────────────────────────

export interface MonthlyRevenue {
  /** ISO month string — "YYYY-MM" */
  month: string
  /** Revenue from own (non-consignment) sales in € */
  ownRevenue: number
  /** Revenue from consignment sales in € */
  consignmentRevenue: number
}

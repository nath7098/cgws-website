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
export type ProductCondition = 'new' | 'excellent' | 'good' | 'fair'
export type ProductCategory =
  | 'selles'
  | 'brides-licols'
  | 'bottes-chaussures'
  | 'vetements'
  | 'accessoires'
  | 'protections'
export type ConsignmentStatus = 'pending' | 'accepted' | 'rejected' | 'sold' | 'returned'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check'

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

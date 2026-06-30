export type ProductStatus = 'active' | 'sold' | 'reserved' | 'inactive'
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

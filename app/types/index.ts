// types/index.ts

// ---------------------------------
// 1. Authentication & Roles
// ---------------------------------
export type UserRole = 'editor' | 'viewer'

export interface AuthUser {
  uid: string
  role: UserRole
  email?: string
  displayName?: string
  photoURL?: string
}

// ---------------------------------
// 2. Product
// ---------------------------------
export interface Product {
  id: string
  code: string | number
  nameAr: string
  nameEn: string
  images?: string[]
  boxCapacity: number
  defaultPurchasePrice?: number
  defaultSellingPrice?: number
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------
// 3. Warehouse
// ---------------------------------
export interface Warehouse {
  id: string
  name: string
  address?: string
  phoneNumber?: string
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------
// 4. Business Partner
// ---------------------------------
export type BusinessPartnerType = 'vendor' | 'client' | 'both'

export interface BusinessPartner {
  id: string
  name: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  image?: string
  type: BusinessPartnerType
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------
// 5. Batch
// ---------------------------------
export interface Batch {
  id: string
  productCode: string | number
  warehouseId?: string
  batchNumber: string
  expirationDate?: string
  boxCount: number
  unitsPerBox: number
  looseUnits?: number
  notes?: string
  purchasePrice?: number
  sellingPrice?: number
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------
// 6. Transaction
// ---------------------------------
export type TransactionType = 'import' | 'export'

export interface TransactionItem {
  batchId: string
  productCode: string | number
  boxes: number
  looseUnits: number
  unitPrice?: number
  totalValue?: number
}

export interface Transaction {
  id: string
  date: string
  type: TransactionType
  businessPartnerId?: string
  items: TransactionItem[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------
// 7. (Optional) Aggregated Inventory
// ---------------------------------
export interface Inventory {
  id: string
  productCode: string | number
  warehouseId?: string
  totalBoxes: number
  totalLooseUnits: number
  lastUpdated?: string
}

export type UserRole = 'editor' | 'viewer'

export interface AuthUser {
  uid: string
  role: UserRole
  email?: string
  displayName?: string
  photoURL?: string
}

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

export interface Warehouse {
  id: string
  name: string
  address?: string
  phoneNumber?: string
  createdAt?: string
  updatedAt?: string
}

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

export interface Inventory {
  id: string
  productCode: string | number
  warehouseId?: string
  totalBoxes: number
  totalLooseUnits: number
  lastUpdated?: string
}

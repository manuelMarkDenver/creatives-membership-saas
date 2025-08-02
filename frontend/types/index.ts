// Enums matching backend Prisma schema
export enum BusinessCategory {
  GYM = 'GYM',
  COFFEE_SHOP = 'COFFEE_SHOP',
  ECOMMERCE = 'ECOMMERCE',
  OTHER = 'OTHER'
}

export enum Role {
  // Global System Role
  SUPER_ADMIN = 'SUPER_ADMIN',
  
  // Universal Business Roles
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  
  // GYM Specific Roles
  GYM_TRAINER = 'GYM_TRAINER',
  GYM_NUTRITIONIST = 'GYM_NUTRITIONIST',
  GYM_FRONT_DESK = 'GYM_FRONT_DESK',
  GYM_MAINTENANCE = 'GYM_MAINTENANCE',
  GYM_MEMBER = 'GYM_MEMBER',
  
  // E-COMMERCE Specific Roles
  STORE_MANAGER = 'STORE_MANAGER',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  FULFILLMENT_STAFF = 'FULFILLMENT_STAFF',
  VENDOR = 'VENDOR',
  ECOM_CUSTOMER = 'ECOM_CUSTOMER',
  
  // COFFEE_SHOP Specific Roles
  COFFEE_MANAGER = 'COFFEE_MANAGER',
  BARISTA = 'BARISTA',
  CASHIER = 'CASHIER',
  BAKER = 'BAKER',
  SHIFT_SUPERVISOR = 'SHIFT_SUPERVISOR',
  COFFEE_CUSTOMER = 'COFFEE_CUSTOMER'
}

export enum AccessLevel {
  FULL_ACCESS = 'FULL_ACCESS',
  MANAGER_ACCESS = 'MANAGER_ACCESS', 
  STAFF_ACCESS = 'STAFF_ACCESS',
  READ_ONLY = 'READ_ONLY'
}

// Core Models
export interface Tenant {
  id: string
  name: string
  slug: string
  category: BusinessCategory
  logoUrl?: string
  address?: string
  phoneNumber?: string
  email?: string
  primaryColor?: string
  secondaryColor?: string
  websiteUrl?: string
  description?: string
  freeBranchOverride?: number
  createdAt: string
  updatedAt: string
  users?: User[]
  branches?: Branch[]
  _count?: {
    users: number
    branches: number
  }
}

export interface Branch {
  id: string
  tenantId: string
  tenant?: Tenant
  name: string
  address?: string
  phoneNumber?: string
  email?: string
  isActive: boolean
  branchData?: any // JSON field for business-specific data
  createdAt: string
  updatedAt: string
  userBranches?: UserBranch[]
  _count?: {
    userBranches: number
    activeMembers?: number
    inactiveMembers?: number
    staff?: number
  }
}

export interface User {
  id: string
  tenantId: string
  tenant?: Tenant
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  role: Role
  isActive: boolean
  notes?: string
  businessData?: any // JSON field for business-specific data
  createdAt: string
  updatedAt: string
  userBranches?: UserBranch[]
}

export interface UserBranch {
  id: string
  userId: string
  branchId: string
  user?: User
  branch?: Branch
  accessLevel: AccessLevel
  isPrimary: boolean
  permissions?: any // JSON field for fine-grained permissions
  createdAt: string
  updatedAt: string
}

// Authentication
export interface AuthUser {
  id: string
  email: string
  role: Role
  tenantId: string
  accessLevel: AccessLevel
  branchAccess: {
    branchId: string
    accessLevel: AccessLevel
    permissions: Record<string, boolean>
    isPrimary: boolean
  }[]
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Business-specific data types
export interface GymMemberData {
  membershipType: 'Gold' | 'Silver' | 'Platinum' | 'Basic'
  startDate: string
  endDate: string
  planFeatures: string[]
  trainerId?: string
}

export interface CoffeeCustomerData {
  loyaltyPoints: number
  preferredDrink?: string
  totalSpent: number
  favoriteOrders: string[]
}

export interface EcommerceCustomerData {
  totalOrders: number
  lastPurchaseAt?: string
  shippingAddresses: any[]
  paymentMethods: any[]
}

// Form DTOs
export interface CreateTenantDto {
  name: string
  category: BusinessCategory
  address?: string
  phoneNumber?: string
  email?: string
  primaryColor?: string
  secondaryColor?: string
  websiteUrl?: string
  description?: string
}

export interface CreateUserDto {
  tenantId: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  role: Role
  isActive?: boolean
  notes?: string
  businessData?: any
}

export interface CreateBranchDto {
  tenantId: string
  name: string
  address?: string
  phoneNumber?: string
  email?: string
  isActive?: boolean
  branchData?: any
}

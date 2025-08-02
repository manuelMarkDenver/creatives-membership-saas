/**
 * Business-specific data interfaces for different tenant types
 * These define the structure of the businessData JSON field
 */

export interface BaseBusinessData {
  type: string;
}

// GYM Business Data
export interface GymMemberData extends BaseBusinessData {
  type: 'gym_member';
  membershipType: 'Basic' | 'Premium' | 'Gold' | 'Platinum';
  startDate: string; // ISO date string
  endDate: string; // ISO date string - THIS IS THE EXPIRATION
  planFeatures: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalNotes?: string;
  paymentStatus?: 'current' | 'overdue' | 'suspended';
}

// COFFEE_SHOP Business Data
export interface CoffeeShopCustomerData extends BaseBusinessData {
  type: 'coffee_customer';
  loyaltyPoints: number;
  favoriteOrders: string[];
  totalSpent: number;
  memberSince: string; // ISO date string
  preferences?: {
    milkType?: string;
    sugarLevel?: string;
    temperature?: string;
  };
}

// E_COMMERCE Business Data
export interface EcommerceCustomerData extends BaseBusinessData {
  type: 'ecommerce_customer';
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  shippingAddresses: Array<{
    id: string;
    label: string;
    address: string;
    city: string;
    country: string;
    isDefault: boolean;
  }>;
  paymentMethods?: Array<{
    id: string;
    type: 'card' | 'paypal' | 'bank';
    last4?: string;
    isDefault: boolean;
  }>;
}

export interface EcommerceStoreOwnerData extends BaseBusinessData {
  type: 'ecommerce_store_owner';
  storeId: string;
  permissions: string[];
  commissionRate?: number;
  totalSales: number;
  productsManaged: number;
}

// Union type for all business data
export type BusinessData =
  | GymMemberData
  | CoffeeShopCustomerData
  | EcommerceCustomerData
  | EcommerceStoreOwnerData;

// Helper functions
export function isGymMember(data: BusinessData): data is GymMemberData {
  return data.type === 'gym_member';
}

export function isCoffeeCustomer(
  data: BusinessData,
): data is CoffeeShopCustomerData {
  return data.type === 'coffee_customer';
}

export function isEcommerceCustomer(
  data: BusinessData,
): data is EcommerceCustomerData {
  return data.type === 'ecommerce_customer';
}

export function isEcommerceStoreOwner(
  data: BusinessData,
): data is EcommerceStoreOwnerData {
  return data.type === 'ecommerce_store_owner';
}

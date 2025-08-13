// Export all stores
export { useBusinessStore } from './business-store'
export { useSubscriptionStore } from './subscription-store'
export { useApiStore, CacheKeys } from './api-store'

// Export types
export type { BusinessType, UserRole, BusinessContext, User } from './business-store'
export type { 
  SubscriptionStatus, 
  MemberStatus, 
  CustomerSubscription, 
  MemberData, 
  SubscriptionStats,
  ExpiringMember 
} from './subscription-store'

// Store cleanup utilities
export const resetAllStores = () => {
  useBusinessStore.getState().reset()
  useSubscriptionStore.getState().reset()
  useApiStore.getState().reset()
}

// Multi-business helpers
export const switchBusiness = (businessContext: BusinessContext) => {
  const businessStore = useBusinessStore.getState()
  const apiStore = useApiStore.getState()
  
  // Update business context
  businessStore.setCurrentBusiness(businessContext)
  businessStore.setBusinessSlug(businessContext.slug)
  
  // Clear cache when switching businesses
  apiStore.clearCache()
}

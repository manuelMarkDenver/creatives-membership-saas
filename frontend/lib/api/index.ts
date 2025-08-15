// Export API client and services
export { apiClient, setTenantContext, getTenantContext } from './client'
export { apiClient as api } from './client' // Also export as 'api' for consistency
export { tenantsApi } from './tenants'
export { branchesApi } from './branches'
export { usersApi } from './users'
export { statsApi } from './stats'
export { plansApi } from './plans'
export { subscriptionsApi } from './subscriptions'
export { membersApi } from './members'
export { gymSubscriptionsApi } from './gym-subscriptions'
export { businessUnitsApi } from './business-units'

// Export DTOs and types
export type { CreateTenantDto, UpdateTenantDto, TenantQueryParams } from './tenants'
export type { CreateBranchDto, UpdateBranchDto, BranchQueryParams } from './branches'
export type { CreateUserDto, UpdateUserDto, UserQueryParams, AssignBranchDto } from './users'
export type {
  SystemOverviewStats,
  SystemBranchStats,
  SystemMemberStats,
  SystemSubscriptionStats,
  TenantDashboard,
  BranchStats,
  MemberStats,
  SubscriptionStats
} from './stats'
export type {
  Plan,
  PlanDetails,
  CreatePlanData,
  UpdatePlanData,
  PlanSubscriptions
} from './plans'
export type {
  Subscription,
  CreateSubscriptionData,
  UpdateSubscriptionData,
  SubscriptionFilters,
  AllSubscriptionsResponse,
  TenantSubscriptionStatus,
  ExpiringSoonResponse
} from './subscriptions'
export type {
  MemberActionRequest,
  MemberRenewRequest,
  MemberHistoryQuery,
  MemberHistoryItem,
  MemberHistoryResponse,
  MemberActionResponse
} from './members'
export type {
  GymMemberSubscriptionRenewalData,
  GymMemberSubscriptionCancellationData,
  GymSubscriptionResponse,
  GymSubscriptionStats
} from './gym-subscriptions'
export type {
  BusinessUnit,
  CreateBusinessUnitData,
  UpdateBusinessUnitData,
  BusinessUnitStats,
  PaidModeToggleData
} from './business-units'

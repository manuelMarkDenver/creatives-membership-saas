import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/lib/api'

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
  systemOverview: () => [...statsKeys.all, 'system', 'overview'] as const,
  systemBranches: () => [...statsKeys.all, 'system', 'branches'] as const,
  systemMembers: () => [...statsKeys.all, 'system', 'members'] as const,
  systemStaff: () => [...statsKeys.all, 'system', 'staff'] as const,
  systemSubscriptions: () => [...statsKeys.all, 'system', 'subscriptions'] as const,
  tenantDashboard: () => [...statsKeys.all, 'tenant', 'dashboard'] as const,
}

// Get system overview (Super Admin only)
export function useSystemOverview() {
  return useQuery({
    queryKey: statsKeys.systemOverview(),
    queryFn: () => statsApi.getSystemOverview(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get system branch stats (Super Admin only)
export function useSystemBranchStats() {
  return useQuery({
    queryKey: statsKeys.systemBranches(),
    queryFn: () => statsApi.getSystemBranchStats(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get system member stats (Super Admin only)
export function useSystemMemberStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: statsKeys.systemMembers(),
    queryFn: () => statsApi.getSystemMemberStats(),
    staleTime: 30 * 1000, // 30 seconds
    enabled: options?.enabled ?? true,
  })
}

// Get system staff stats (Super Admin only)
export function useSystemStaffStats() {
  return useQuery({
    queryKey: statsKeys.systemStaff(),
    queryFn: () => statsApi.getSystemStaffStats(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get system subscription stats (Super Admin only)
export function useSystemSubscriptionStats() {
  return useQuery({
    queryKey: statsKeys.systemSubscriptions(),
    queryFn: () => statsApi.getSystemSubscriptionStats(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Get tenant dashboard (Owner/Manager)
export function useTenantDashboard() {
  return useQuery({
    queryKey: statsKeys.tenantDashboard(),
    queryFn: () => statsApi.getTenantDashboard(),
    staleTime: 30 * 1000, // 30 seconds
  })
}

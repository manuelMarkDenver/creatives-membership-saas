import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, CreateUserDto, UpdateUserDto, UserQueryParams, AssignBranchDto } from '@/lib/api'
import { User, Role, AccessLevel } from '@/types'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserQueryParams) => [...userKeys.lists(), params] as const,
  byTenant: (tenantId: string, params?: Omit<UserQueryParams, 'tenantId'>) => 
    [...userKeys.all, 'tenant', tenantId, params] as const,
  byBranch: (branchId: string, params?: Omit<UserQueryParams, 'branchId'>) => 
    [...userKeys.all, 'branch', branchId, params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  branches: (userId: string) => [...userKeys.all, 'branches', userId] as const,
}

// Get all users
export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getAll(params),
    enabled: true,
  })
}

// Get users by tenant
export function useUsersByTenant(
  tenantId: string, 
  params?: Omit<UserQueryParams, 'tenantId'>
) {
  return useQuery({
    queryKey: userKeys.byTenant(tenantId, params),
    queryFn: () => usersApi.getByTenant(tenantId, params),
    enabled: !!tenantId,
  })
}

// Get users by branch
export function useUsersByBranch(
  branchId: string, 
  params?: Omit<UserQueryParams, 'branchId'>
) {
  return useQuery({
    queryKey: userKeys.byBranch(branchId, params),
    queryFn: () => usersApi.getByBranch(branchId, params),
    enabled: !!branchId,
  })
}

// Get user by ID
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  })
}

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async (): Promise<User> => {
      // Always get fresh data from localStorage for login sessions
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user_data');
        const storedToken = localStorage.getItem('auth_token');

        // DEVELOPMENT BYPASS: Return default owner profile for development
        const BYPASS_AUTH = process.env.NODE_ENV === 'development' &&
          process.env.NEXT_PUBLIC_API_BYPASS_AUTH === 'true';
        if (BYPASS_AUTH && !storedUser) {
          console.log('🔧 Using development bypass profile');
          const bypassUser = {
            id: '00386588-101b-4653-83ff-77fb5677363a',
            email: 'owner@muscle-mania.com',
            firstName: 'Juan',
            lastName: 'Cruz',
            name: 'Juan Cruz',
            role: 'OWNER' as Role,
            globalRole: 'OWNER',
            tenantId: 'cc1d8a60-6215-4e9c-a921-365e5084526f',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as User;

          // Store bypass user data in localStorage for API client to use
          localStorage.setItem('user_data', JSON.stringify(bypassUser));
          return bypassUser;
        }

        if (storedUser && storedToken) {
          try {
            // Check if storedUser is not empty before parsing
            if (!storedUser || storedUser.trim() === '') {
              console.warn('Empty user data in localStorage, clearing...');
              localStorage.removeItem('user_data');
              localStorage.removeItem('auth_token');
              throw new Error('Empty user data');
            }

            const userData = JSON.parse(storedUser);

            // Map globalRole to role for frontend compatibility
            if (userData.globalRole && !userData.role) {
              userData.role = userData.globalRole;
            }

            // Verify the data is not corrupted and has the required role field
            if (userData && userData.id && userData.email && userData.role) {
              // For OWNER role, userBranches might legitimately be empty/undefined
              // since owners typically have access to all branches without explicit assignments
              if (userData.role === 'OWNER' || userData.role === 'SUPER_ADMIN') {
                return userData;
              }

              // If userBranches is missing for other roles, try to get fresh data
              if (!userData.userBranches) {
                // Fall through to API call
              } else {
                return userData;
              }
            }
          } catch (error) {
            console.warn('Failed to parse stored user data:', error);
            // Clear corrupted data
            localStorage.removeItem('user_data');
            localStorage.removeItem('auth_token');
          }
        }

        // Fallback to API call if localStorage data is not available or valid
        return usersApi.getProfile();
      }

      // Server-side fallback
      return usersApi.getProfile();
    },
    staleTime: 1 * 60 * 1000, // 1 minute - shorter cache for more accurate role detection
    retry: (failureCount, error) => {
      // Don't retry 401 errors (authentication issues)
      if ((error as any)?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Helper function to refresh profile cache (useful after login)
export function useRefreshProfile() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: userKeys.profile() })
    queryClient.refetchQueries({ queryKey: userKeys.profile() })
  }
}

// Get user's branch assignments
export function useUserBranches(userId: string) {
  return useQuery({
    queryKey: userKeys.branches(userId),
    queryFn: () => usersApi.getBranches(userId),
    enabled: !!userId,
  })
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: (newUser: User) => {
      // Invalidate user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...userKeys.all, 'tenant', newUser.tenantId] 
      })
      
      // Add new user to cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser)
    },
  })
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: (updatedUser: User) => {
      // Update cached user
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
      
      // Invalidate all relevant queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...userKeys.all, 'tenant', updatedUser.tenantId] 
      })
      
      // Also invalidate gym members queries for proper member list refresh
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      queryClient.invalidateQueries({ queryKey: ['gym-subscriptions'] })
    },
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserDto) => usersApi.updateProfile(data),
    onSuccess: (updatedUser: User) => {
      // Update profile cache
      queryClient.setQueryData(userKeys.profile(), updatedUser)
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
    },
  })
}

// Delete user mutation (hard delete)
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedId) })
      queryClient.removeQueries({ queryKey: userKeys.branches(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Soft delete user mutation
export function useSoftDeleteUser() {
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()

  return useMutation({
    mutationFn: async ({ id, reason, notes }: { id: string; reason: string; notes?: string }) => {
      const deleteData = {
        reason: reason || 'Administrative deletion',
        notes: notes || `Deleted by ${profile?.firstName} ${profile?.lastName} (${profile?.id})`
      }
      // Use the gym-members API for member deletion
      const { membersApi } = await import('@/lib/api/gym-members')
      return membersApi.deleteMember(id, deleteData)
    },
    onSuccess: (response: any) => {
      // The gym-members API returns a different response structure
      // Invalidate all relevant queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'tenant'] })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })

      // Also invalidate gym members queries for proper member list refresh
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      queryClient.invalidateQueries({ queryKey: ['gym-subscriptions'] })
    },
  })
}

// Assign user to branch mutation
export function useAssignUserToBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignBranchDto }) =>
      usersApi.assignToBranch(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user's branch assignments
      queryClient.invalidateQueries({ queryKey: userKeys.branches(userId) })
      
      // Invalidate branch user lists
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Update branch assignment mutation
export function useUpdateBranchAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      userId, 
      branchId, 
      data 
    }: { 
      userId: string; 
      branchId: string; 
    data: { accessLevel: AccessLevel }
    }) =>
      usersApi.updateBranchAssignment(userId, branchId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.branches(userId) })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Remove user from branch mutation
export function useRemoveUserFromBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, branchId }: { userId: string; branchId: string }) =>
      usersApi.removeFromBranch(userId, branchId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.branches(userId) })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Invite user mutation
export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; role: Role; tenantId: string; branchIds?: string[] }) =>
      usersApi.invite(data),
    onSuccess: () => {
      // Invalidate user lists to show pending invitations
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Accept invite mutation
export function useAcceptInvite() {
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: { name: string; password: string } }) =>
      usersApi.acceptInvite(token, data),
  })
}

// Activate user mutation
export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      const updateData = {
        deletedAt: undefined,
        deletedBy: undefined
      }
      return usersApi.update(id, updateData)
    },
    onSuccess: (updatedUser: User) => {
      // Update cached user
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
      
      // Invalidate lists to show updated user
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...userKeys.all, 'tenant', updatedUser.tenantId] 
      })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Deactivate user mutation
export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      const updateData = {
        // Note: User deactivation is now handled by soft delete
        deletedAt: new Date().toISOString(),
        deletedBy: 'system'
      }
      return usersApi.update(id, updateData)
    },
    onSuccess: (updatedUser: User) => {
      // Update cached user
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...userKeys.all, 'tenant', updatedUser.tenantId] 
      })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
    },
  })
}

// Restore deleted user mutation
export function useRestoreUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      const updateData = {
        deletedAt: undefined,
        deletedBy: undefined
      }
      return usersApi.update(id, updateData)
    },
    onSuccess: (updatedUser: User) => {
      // Update cached user
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser)
      
      // Invalidate all relevant queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...userKeys.all, 'tenant', updatedUser.tenantId] 
      })
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'branch'] })
      
      // Also invalidate gym members queries for proper member list refresh
      queryClient.invalidateQueries({ queryKey: ['gym-members'] })
      queryClient.invalidateQueries({ queryKey: ['gym-subscriptions'] })
    },
  })
}

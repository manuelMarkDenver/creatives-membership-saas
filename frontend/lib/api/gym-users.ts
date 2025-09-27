import { apiClient } from './client'
import { User, UserBranch, Role, AccessLevel } from '@/types'

export interface CreateUserDto {
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
  globalRole?: Role
  photoUrl?: string
  notes?: string
  businessData?: any
  tenantId?: string // Used for header, not sent in body
}

export interface UpdateUserDto {
  email?: string
  name?: string
  role?: Role
  accessLevel?: AccessLevel
  isActive?: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: Role
  tenantId?: string
  branchId?: string
  accessLevel?: AccessLevel
}

export interface AssignBranchDto {
  branchId: string
  accessLevel?: AccessLevel
}

export const usersApi = {
  // Get all users (paginated with filters)
  getAll: async (params?: UserQueryParams) => {
    const response = await apiClient.get('/gym/users', { params })
    return response.data
  },

  // Get users for a specific tenant
  getByTenant: async (tenantId: string, params?: Omit<UserQueryParams, 'tenantId'>) => {
    const response = await apiClient.get(`/gym/users/tenant/${tenantId}`, { params })
    return response.data
  },

  // Get users for a specific branch
  getByBranch: async (branchId: string, params?: Omit<UserQueryParams, 'branchId'>) => {
    const response = await apiClient.get(`/branches/${branchId}/users`, { params })
    return response.data
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/gym/users/${id}`)
    return response.data
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    // Always get fresh data from localStorage for login sessions
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_data');
      const storedToken = localStorage.getItem('auth_token');

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
    }

    // Fall back to API call if no valid localStorage data or userBranches missing for non-owners
    try {
      const response = await apiClient.get('/auth/me')
      const userData = response.data.user || response.data;

      // Map globalRole to role for frontend compatibility
      if (userData.globalRole && !userData.role) {
        userData.role = userData.globalRole;
      }

      // Store fresh data from API
      if (typeof window !== 'undefined' && userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }

      return userData
    } catch (apiError: any) {
      // If API fails, fall back to stored data if available
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser && storedUser.trim() !== '') {
          try {
            const userData = JSON.parse(storedUser);

            // Map globalRole to role for frontend compatibility
            if (userData.globalRole && !userData.role) {
              userData.role = userData.globalRole;
            }

            // For OWNER/SUPER_ADMIN, missing userBranches is acceptable
            if (userData.role === 'OWNER' || userData.role === 'SUPER_ADMIN') {
              // Ensure userBranches is at least an empty array for consistent handling
              userData.userBranches = userData.userBranches || [];
            }

            return userData;
          } catch (parseError) {
            console.error('Failed to parse stored data as fallback:', parseError);
          }
        }
      }

      // Re-throw the API error if no fallback is available
      throw apiError;
    }
  },

  // Create user
  create: async (data: CreateUserDto): Promise<User> => {
    // Extract tenantId for header and remove it from request body
    const { tenantId, ...requestBody } = data
    
    const response = await apiClient.post('/gym/users', requestBody, {
      headers: {
        'x-tenant-id': tenantId
      }
    })
    return response.data
  },

  // Update user
  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch(`/gym/users/${id}`, data)
    return response.data
  },

  // Update user profile (current user)
  // Note: This endpoint may need to be implemented in the backend
  updateProfile: async (data: UpdateUserDto): Promise<User> => {
    // TODO: Implement /auth/profile PUT endpoint in backend
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/gym/users/${id}`)
  },

  // Get user's branch assignments
  getBranches: async (userId: string): Promise<UserBranch[]> => {
    const response = await apiClient.get(`/gym/users/${userId}/branches`)
    return response.data
  },

  // Assign user to branch
  assignToBranch: async (userId: string, data: AssignBranchDto): Promise<UserBranch> => {
    const response = await apiClient.post(`/gym/users/${userId}/branches`, data)
    return response.data
  },

  // Update user's branch assignment
  updateBranchAssignment: async (
    userId: string,
    branchId: string,
    data: { accessLevel: AccessLevel }
  ): Promise<UserBranch> => {
    const response = await apiClient.put(`/gym/users/${userId}/branches/${branchId}`, data)
    return response.data
  },

  // Remove user from branch
  removeFromBranch: async (userId: string, branchId: string): Promise<void> => {
    await apiClient.delete(`/gym/users/${userId}/branches/${branchId}`)
  },

  // Invite user to tenant (send invitation email)
  invite: async (data: { email: string; role: Role; tenantId: string; branchIds?: string[] }) => {
    const response = await apiClient.post('/gym/users/invite', data)
    return response.data
  },

  // Accept invitation (for invited users)
  acceptInvite: async (token: string, data: { name: string; password: string }) => {
    const response = await apiClient.post(`/gym/users/accept-invite/${token}`, data)
    return response.data
  },
}

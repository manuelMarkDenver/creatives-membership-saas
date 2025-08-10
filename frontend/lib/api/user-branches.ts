import { apiClient } from './client'

export interface UserBranch {
  id: string
  userId: string
  branchId: string
  accessLevel: 'FULL_ACCESS' | 'MANAGER_ACCESS' | 'STAFF_ACCESS' | 'READ_ONLY'
  isPrimary: boolean
  permissions?: any
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    isActive: boolean
  }
  branch: {
    id: string
    name: string
    address: string
    isActive: boolean
  }
}

export interface CreateUserBranchDto {
  userId: string
  branchId: string
  accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS'
  isPrimary?: boolean
  permissions?: any
}

export interface UpdateUserBranchDto {
  accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS'
  isPrimary?: boolean
  permissions?: any
}

export interface BulkAssignDto {
  userId: string
  branchIds: string[]
  accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS'
  primaryBranchId?: string
}

// Get all user-branch assignments
export const getUserBranchAssignments = async (params?: {
  tenantId?: string
  branchId?: string
  userId?: string
}) => {
  const response = await apiClient.get('/user-branches', { params })
  return response.data
}

// Get branch assignments for a specific user
export const getUserBranches = async (userId: string) => {
  const response = await apiClient.get(`/user-branches/user/${userId}`)
  return response.data
}

// Get users assigned to a specific branch
export const getBranchUsers = async (branchId: string) => {
  const response = await apiClient.get(`/user-branches/branch/${branchId}`)
  return response.data
}

// Assign user to branch
export const assignUserToBranch = async (data: CreateUserBranchDto) => {
  const response = await apiClient.post('/user-branches', data)
  return response.data
}

// Update user-branch assignment
export const updateUserBranchAssignment = async (id: string, data: UpdateUserBranchDto) => {
  const response = await apiClient.put(`/user-branches/${id}`, data)
  return response.data
}

// Remove user from branch
export const removeUserFromBranch = async (id: string) => {
  const response = await apiClient.delete(`/user-branches/${id}`)
  return response.data
}

// Bulk assign user to multiple branches
export const bulkAssignUserToBranches = async (data: BulkAssignDto) => {
  const response = await apiClient.post('/user-branches/bulk-assign', data)
  return response.data
}

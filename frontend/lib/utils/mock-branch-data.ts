import { Branch } from '@/types'

/**
 * Enhances branch data with mock member counts for demonstration purposes
 * This simulates what the backend should return when properly implemented
 */
export function enhanceBranchWithMockData(branch: Branch): Branch {
  // Generate realistic member counts based on branch name/characteristics
  const branchNameHash = branch.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seed = branchNameHash % 100

  // Generate member counts based on seeded random
  const totalMembers = Math.floor(seed * 3) + Math.floor(Math.random() * 50) + 20
  const activeMembers = Math.floor(totalMembers * 0.9) + Math.floor(Math.random() * 5)
  const deletedMembers = Math.max(0, totalMembers - activeMembers)
  const staff = Math.floor(seed / 10) + Math.floor(Math.random() * 8) + 3

  return {
    ...branch,
    _count: {
      ...branch._count,
      userBranches: totalMembers,
      activeMembers: activeMembers,
      deletedMembers: deletedMembers,
      staff: staff
    }
  }
}

/**
 * Enhances an array of branches with mock data
 */
export function enhanceBranchesWithMockData(branches: Branch[]): Branch[] {
  return branches.map(enhanceBranchWithMockData)
}

/**
 * Creates sample branch data for testing
 */
export function createMockBranches(count: number = 3): Branch[] {
  const sampleBranches: Branch[] = [
    {
      id: '1',
      tenantId: 'tenant-1',
      name: 'Downtown Fitness Center',
      address: '123 Main Street, Manila, Philippines',
      phoneNumber: '+63 2 8123 4567',
      email: 'downtown@fitnesscenter.ph',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { userBranches: 0 }
    },
    {
      id: '2',
      tenantId: 'tenant-1',
      name: 'Makati Branch',
      address: '456 Ayala Avenue, Makati, Philippines',
      phoneNumber: '+63 2 8234 5678',
      email: 'makati@fitnesscenter.ph',
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { userBranches: 0 }
    },
    {
      id: '3',
      tenantId: 'tenant-1',
      name: 'Quezon City Hub',
      address: '789 EDSA, Quezon City, Philippines',
      phoneNumber: '+63 2 8345 6789',
      email: 'qc@fitnesscenter.ph',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { userBranches: 0 }
    }
  ]

  return enhanceBranchesWithMockData(sampleBranches.slice(0, count))
}

#!/usr/bin/env node
/**
 * Test Updated Branch-Based User Filtering
 * This script tests the new getUsersByTenant method with branch filtering
 */

const { PrismaClient } = require('@prisma/client')

// Mock logger to prevent issues
const mockLogger = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
}

class UsersService {
  constructor() {
    this.prisma = new PrismaClient()
    this.logger = mockLogger
  }

  async testUpdatedBranchFiltering() {
    try {
      console.log('🧪 Testing updated branch-based user filtering...\n')

      // Get some test users from different roles
      const testUsers = await this.prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'STAFF'] },
          isActive: true
        },
        include: {
          userBranches: {
            include: {
              branch: { select: { id: true, name: true } }
            }
          }
        },
        take: 3
      })

      if (testUsers.length === 0) {
        console.log('❌ No MANAGER or STAFF users found to test with')
        return
      }

      console.log(`Found ${testUsers.length} test users:\n`)
      
      for (const user of testUsers) {
        console.log(`👤 ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`)
        console.log(`   Tenant: ${user.tenantId}`)
        console.log(`   Branch Access: ${user.userBranches.map(ub => ub.branch.name).join(', ') || 'None'}`)
        
        // Test 1: Get all staff members they should see
        console.log(`\n   🔍 Testing staff visibility...`)
        try {
          const staffResult = await this.getUsersByTenant(user.tenantId, {
            role: 'STAFF',
            requestingUserId: user.id,
            requestingUserRole: user.role
          })
          console.log(`   ✅ Can see ${staffResult.length} staff members`)
          
          if (staffResult.length > 0) {
            const staffBranches = new Set()
            staffResult.forEach(staff => {
              staff.userBranches.forEach(ub => {
                staffBranches.add(ub.branch.name)
              })
            })
            console.log(`      - Staff from branches: ${Array.from(staffBranches).join(', ')}`)
          }
        } catch (error) {
          console.log(`   ❌ Error getting staff: ${error.message}`)
        }

        // Test 2: Get gym members they should see
        console.log(`\n   🏋️ Testing member visibility...`)
        try {
          const memberResult = await this.getUsersByTenant(user.tenantId, {
            role: 'GYM_MEMBER',
            requestingUserId: user.id,
            requestingUserRole: user.role
          })
          console.log(`   ✅ Can see ${memberResult.length} gym members`)
        } catch (error) {
          console.log(`   ❌ Error getting members: ${error.message}`)
        }

        console.log('') // Empty line for readability
      }

    } catch (error) {
      console.error('💥 Test failed:', error.message)
      console.error(error.stack)
    } finally {
      await this.prisma.$disconnect()
    }
  }

  // Copy of the updated getUsersByTenant method for testing
  async getUsersByTenant(tenantId, filters) {
    try {
      // Validate tenant ID format (simplified)
      if (!tenantId) {
        throw new Error('Invalid tenant ID format');
      }

      // Build where clause
      const whereClause = { tenantId };
      
      // Add role filter if provided
      if (filters?.role) {
        whereClause.role = filters.role;
      }

      // Apply branch-based filtering for MANAGER and STAFF roles
      if (filters?.requestingUserId && filters?.requestingUserRole && 
          ['MANAGER', 'STAFF'].includes(filters.requestingUserRole)) {
        
        // Get the requesting user's branch access
        const requestingUser = await this.prisma.user.findUnique({
          where: { id: filters.requestingUserId },
          include: {
            userBranches: { select: { branchId: true } }
          }
        });

        const accessibleBranchIds = requestingUser?.userBranches.map(ub => ub.branchId) || [];
        
        if (accessibleBranchIds.length > 0) {
          // For members (GYM_MEMBER), filter by customers who have subscriptions in accessible branches
          if (filters.role === 'GYM_MEMBER') {
            const membersInAccessibleBranches = await this.prisma.customerSubscription.findMany({
              where: {
                tenantId,
                branchId: { in: accessibleBranchIds },
                status: 'ACTIVE'
              },
              select: { customerId: true },
              distinct: ['customerId']
            });
            
            const memberUserIds = membersInAccessibleBranches.map(cs => cs.customerId);
            if (memberUserIds.length > 0) {
              whereClause.id = { in: memberUserIds };
            } else {
              whereClause.id = { in: [] }; // No accessible members
            }
          } 
          // For staff/managers, show users who have branch assignments in accessible branches
          else if (['MANAGER', 'STAFF', 'OWNER'].includes(filters.role || '')) {
            const usersInAccessibleBranches = await this.prisma.userBranch.findMany({
              where: {
                branchId: { in: accessibleBranchIds }
              },
              select: { userId: true },
              distinct: ['userId']
            });
            
            const staffUserIds = usersInAccessibleBranches.map(ub => ub.userId);
            if (staffUserIds.length > 0) {
              whereClause.id = { in: staffUserIds };
            } else {
              whereClause.id = { in: [] }; // No accessible staff
            }
          }
        } else {
          // User has no branch assignments, show no results
          whereClause.id = { in: [] };
        }
      }

      // Handle pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          userBranches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return users;
    } catch (error) {
      throw new Error(`Failed to get users for tenant: ${error.message}`);
    }
  }
}

// Run the test
async function main() {
  const service = new UsersService()
  await service.testUpdatedBranchFiltering()
}

if (require.main === module) {
  main().catch(console.error)
}

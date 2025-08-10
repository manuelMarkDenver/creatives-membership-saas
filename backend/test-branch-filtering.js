#!/usr/bin/env node
/**
 * Test Branch Filtering for Different User Roles
 * This script simulates calling getExpiringMembersOverview with different users
 */

const { PrismaClient } = require('@prisma/client')
const { Logger } = require('@nestjs/common')

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

  async testBranchFiltering() {
    try {
      console.log('🧪 Testing branch-based filtering for expiring members...\n')

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
        
        // Test the filtering
        const filters = {
          userId: user.id,
          tenantId: user.tenantId,
          userRole: user.role,
          userTenantId: user.tenantId,
          page: 1,
          limit: 10
        }

        console.log(`\n   🔍 Testing expiring members access...`)
        
        try {
          const result = await this.getExpiringMembersOverview(7, filters)
          console.log(`   ✅ Can access ${result.subscriptions.length} expiring members`)
          console.log(`   📊 Available branches: ${result.availableBranches.length}`)
          
          if (result.availableBranches.length > 0) {
            console.log(`      - ${result.availableBranches.map(b => b.name).join(', ')}`)
          }
          
          if (result.subscriptions.length > 0) {
            const branches = [...new Set(result.subscriptions.map(s => s.branch?.name).filter(Boolean))]
            console.log(`   🏢 Members from branches: ${branches.join(', ') || 'No specific branch'}`)
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`)
        }
        
        console.log('') // Empty line for readability
      }

    } catch (error) {
      console.error('💥 Test failed:', error.message)
    } finally {
      await this.prisma.$disconnect()
    }
  }

  // Copy of the actual service method with minimal modifications for testing
  async getExpiringMembersOverview(daysBefore = 7, filters) {
    try {
      // Validate filters
      if (!filters.page || isNaN(filters.page) || filters.page < 1) {
        filters.page = 1;
      }
      if (!filters.limit || isNaN(filters.limit) || filters.limit < 1) {
        filters.limit = 10;
      }
      
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Get user's branch access information
      const userId = filters.userId;
      let accessibleBranchIds = [];
      let availableBranches = [];
      let userBranchAccess = [];

      if (filters.userRole !== 'SUPER_ADMIN') {
        // Get user's branch access for non-super-admin users
        const userWithBranches = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            userBranches: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });

        userBranchAccess = userWithBranches?.userBranches || [];
        accessibleBranchIds = userBranchAccess.map(ub => ub.branchId);
      }

      // Build where clause based on user role
      let whereClause = {
        status: 'ACTIVE',
        endDate: {
          lte: targetDate,
          gte: new Date() // Not already expired
        }
      };

      // Apply role-based filtering
      if (filters.userRole === 'SUPER_ADMIN') {
        // Super Admin can filter by specific tenant
        if (filters.tenantId) {
          whereClause.tenantId = filters.tenantId;
          
          // If tenant is specified, get available branches for filtering
          availableBranches = await this.prisma.branch.findMany({
            where: { tenantId: filters.tenantId, isActive: true },
            select: { id: true, name: true, address: true }
          });
        }
        
        // Super admin can also filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'OWNER') {
        // Owners can see all branches in their tenant
        whereClause.tenantId = filters.userTenantId;
        
        // Get all branches in the tenant for branch filtering dropdown
        availableBranches = await this.prisma.branch.findMany({
          where: { tenantId: filters.userTenantId, isActive: true },
          select: { id: true, name: true, address: true }
        });
        
        // Owner can filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'MANAGER') {
        // Managers can see branches they have access to
        whereClause.tenantId = filters.userTenantId;
        
        if (accessibleBranchIds.length > 0) {
          if (filters.branchId && accessibleBranchIds.includes(filters.branchId)) {
            // Filter by specific branch if they have access
            whereClause.branchId = filters.branchId;
          } else if (!filters.branchId) {
            // Show all accessible branches by default
            whereClause.branchId = { in: accessibleBranchIds };
          } else {
            // Trying to access branch they don't have permission to
            whereClause.branchId = { in: [] }; // Return no results
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }
        
        // Available branches for dropdown (only branches they have access to)
        availableBranches = userBranchAccess.map(ub => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address
        }));
      } else if (filters.userRole === 'STAFF') {
        // Staff can only see branches they're explicitly assigned to
        whereClause.tenantId = filters.userTenantId;
        
        if (accessibleBranchIds.length > 0) {
          if (filters.branchId && accessibleBranchIds.includes(filters.branchId)) {
            whereClause.branchId = filters.branchId;
          } else {
            // Show only branches they have access to
            whereClause.branchId = { in: accessibleBranchIds };
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }
        
        // Available branches for dropdown
        availableBranches = userBranchAccess.map(ub => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address
        }));
      }

      const [subscriptions, totalCount] = await Promise.all([
        this.prisma.customerSubscription.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                photoUrl: true
              }
            },
            membershipPlan: {
              select: {
                id: true,
                name: true,
                type: true,
                price: true
              }
            },
            tenant: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            branch: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          },
          orderBy: { endDate: 'asc' },
          skip: Math.max(0, (filters.page - 1) * filters.limit),
          take: Math.min(100, filters.limit)
        }),
        this.prisma.customerSubscription.count({ where: whereClause })
      ]);
      
      // Calculate days until expiry for each subscription
      const enrichedSubscriptions = subscriptions.map(subscription => {
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...subscription,
          daysUntilExpiry,
          memberName: `${subscription.customer.firstName} ${subscription.customer.lastName}`.trim(),
          isExpired: daysUntilExpiry <= 0,
          urgency: daysUntilExpiry <= 1 ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium'
        };
      });

      return {
        subscriptions: enrichedSubscriptions,
        availableBranches,
        userRole: filters.userRole,
        accessSummary: {
          totalAccessibleBranches: availableBranches.length,
          canFilterByBranch: availableBranches.length > 1,
          canFilterByTenant: filters.userRole === 'SUPER_ADMIN'
        },
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / filters.limit),
          hasNext: filters.page * filters.limit < totalCount,
          hasPrev: filters.page > 1
        },
        summary: {
          totalExpiring: totalCount,
          daysBefore,
          critical: enrichedSubscriptions.filter(s => s.urgency === 'critical').length,
          high: enrichedSubscriptions.filter(s => s.urgency === 'high').length,
          medium: enrichedSubscriptions.filter(s => s.urgency === 'medium').length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get expiring members overview: ${error.message}`);
      throw new Error('Failed to get expiring members overview');
    }
  }
}

// Run the test
async function main() {
  const service = new UsersService()
  await service.testBranchFiltering()
}

if (require.main === module) {
  main().catch(console.error)
}

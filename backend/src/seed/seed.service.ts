import { Injectable } from '@nestjs/common'
import { PrismaService } from '../core/prisma/prisma.service'
import { execSync } from 'child_process'

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDatabase() {
    try {
      // Run the seed script
      const result = execSync('npx ts-node prisma/seed.ts', { 
        cwd: process.cwd(),
        encoding: 'utf8'
      })
      
      return {
        success: true,
        message: 'Database seeding completed successfully',
        output: result
      }
    } catch (error) {
      return {
        success: false,
        message: 'Database seeding failed',
        error: error.message
      }
    }
  }

  async getDatabaseStatus() {
    try {
      // Check if basic data exists
      const [
        tenantCount,
        userCount,
        planCount,
        membershipPlanCount,
        adminCount
      ] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.user.count({ where: { role: 'GYM_MEMBER' } }),
        this.prisma.plan.count(),
        this.prisma.membershipPlan.count(),
        this.prisma.user.count({ where: { email: 'admin@creatives-saas.com' } })
      ])

      return {
        success: true,
        counts: {
          tenants: tenantCount,
          gymMembers: userCount,
          subscriptionPlans: planCount,
          membershipPlans: membershipPlanCount,
          superAdmin: adminCount
        },
        seeded: tenantCount > 0 && adminCount > 0
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to check database status',
        error: error.message
      }
    }
  }
}

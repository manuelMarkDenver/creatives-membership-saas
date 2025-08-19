import { Injectable } from '@nestjs/common'
import { PrismaService } from '../core/prisma/prisma.service'
import { execSync } from 'child_process'

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDatabase() {
    try {
      // Clear existing data first to ensure clean seeding
      console.log('🧹 Clearing existing data...');
      
      // Delete in correct order to avoid foreign key constraints
      await this.prisma.customerTransaction.deleteMany({});
      await this.prisma.payment.deleteMany({});
      await this.prisma.gymMemberSubscription.deleteMany({});
      await this.prisma.userBranch.deleteMany({});
      await this.prisma.subscription.deleteMany({});
      await this.prisma.gymMembershipPlan.deleteMany({});
      await this.prisma.businessUnit.deleteMany({});
      await this.prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });
      await this.prisma.tenant.deleteMany({});
      await this.prisma.plan.deleteMany({});
      
      console.log('✅ Existing data cleared successfully');
      
      // Run the comprehensive Filipino seed script
      const result = execSync('node prisma/seed-filipino.js', { 
        cwd: process.cwd(),
        encoding: 'utf8'
      })
      
      return {
        success: true,
        message: 'Database seeding completed successfully with realistic Filipino members',
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

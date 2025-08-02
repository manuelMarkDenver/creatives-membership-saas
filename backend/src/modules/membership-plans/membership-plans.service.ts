import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto/membership-plan.dto';

@Injectable()
export class MembershipPlansService {
  constructor(private prisma: PrismaService) {}

  async createMembershipPlan(createDto: CreateMembershipPlanDto) {
    try {
      // Check if plan name already exists for this tenant
      const existingPlan = await this.prisma.membershipPlan.findUnique({
        where: {
          tenantId_name: {
            tenantId: createDto.tenantId,
            name: createDto.name,
          },
        },
      });

      if (existingPlan) {
        throw new ConflictException('A membership plan with this name already exists for this tenant');
      }

      // Verify tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: createDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return await this.prisma.membershipPlan.create({
        data: {
          ...createDto,
          benefits: createDto.benefits ? JSON.stringify(createDto.benefits) : undefined,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to create membership plan');
    }
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { tenantId },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAllActive(tenantId: string) {
    return this.prisma.membershipPlan.findMany({
      where: { 
        tenantId,
        isActive: true 
      },
      orderBy: { price: 'asc' },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { 
        id,
        tenantId 
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    return plan;
  }

  async update(id: string, tenantId: string, updateDto: UpdateMembershipPlanDto) {
    // Verify the plan exists and belongs to the tenant
    const existingPlan = await this.findOne(id, tenantId);

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== existingPlan.name) {
      const conflictingPlan = await this.prisma.membershipPlan.findUnique({
        where: {
          tenantId_name: {
            tenantId,
            name: updateDto.name,
          },
        },
      });

      if (conflictingPlan) {
        throw new ConflictException('A membership plan with this name already exists for this tenant');
      }
    }

    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...updateDto,
        benefits: updateDto.benefits ? JSON.stringify(updateDto.benefits) : undefined,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async toggleStatus(id: string, tenantId: string) {
    const plan = await this.findOne(id, tenantId);
    
    return this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    // Verify the plan exists and belongs to the tenant
    await this.findOne(id, tenantId);

    // Check if any members are using this plan (from User businessData)
    const membersWithPlan = await this.prisma.user.findFirst({
      where: {
        tenantId,
        role: 'GYM_MEMBER',
        businessData: {
          path: ['membership', 'planId'],
          equals: id,
        },
      },
    });

    if (membersWithPlan) {
      throw new ConflictException('Cannot delete membership plan that is currently in use by members');
    }

    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prisma.membershipPlan.count({ where: { tenantId } }),
      this.prisma.membershipPlan.count({ where: { tenantId, isActive: true } }),
      this.prisma.membershipPlan.count({ where: { tenantId, isActive: false } }),
    ]);

    // Get usage stats by checking User businessData
    const membershipUsage = await this.prisma.user.groupBy({
      by: ['businessData'],
      where: {
        tenantId,
        role: 'GYM_MEMBER',
        businessData: {
          path: ['membership'],
          not: Prisma.DbNull,
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      total,
      active,
      inactive,
      usageCount: membershipUsage.length,
    };
  }

  /**
   * Super admin method to get all membership plans across all tenants
   */
  async findAllPlansForSuperAdmin() {
    const plans = await this.prisma.membershipPlan.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: [
        { tenant: { name: 'asc' } },
        { createdAt: 'desc' },
      ],
    });

    // Group plans by tenant and add member count for each plan
    const groupedPlans = [];
    const tenantGroups = new Map();

    for (const plan of plans) {
      // Count members using this specific plan
      const memberCount = await this.prisma.user.count({
        where: {
          tenantId: plan.tenantId,
          role: 'GYM_MEMBER',
          businessData: {
            path: ['membership', 'planId'],
            equals: plan.id,
          },
        },
      });

      const planWithMemberCount = {
        ...plan,
        memberCount,
        benefits: plan.benefits ? JSON.parse(plan.benefits as string) : [],
      };

      if (!tenantGroups.has(plan.tenantId)) {
        tenantGroups.set(plan.tenantId, {
          id: plan.tenantId,
          tenantId: plan.tenantId,
          tenantName: plan.tenant.name,
          tenantCategory: plan.tenant.category,
          plans: [],
        });
      }

      tenantGroups.get(plan.tenantId).plans.push(planWithMemberCount);
    }

    return Array.from(tenantGroups.values());
  }
}

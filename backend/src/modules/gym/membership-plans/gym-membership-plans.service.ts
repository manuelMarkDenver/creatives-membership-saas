import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
} from '../../membership-plans/dto/membership-plan.dto';

@Injectable()
export class GymMembershipPlansService {
  constructor(private prisma: PrismaService) {}

  async createMembershipPlan(createDto: CreateMembershipPlanDto) {
    try {
      // Check if plan name already exists for this gym tenant
      const existingPlan = await this.prisma.membershipPlan.findUnique({
        where: {
          tenantId_name: {
            tenantId: createDto.tenantId,
            name: createDto.name,
          },
        },
      });

      if (existingPlan) {
        throw new ConflictException(
          'A gym membership plan with this name already exists for this gym',
        );
      }

      // Verify tenant exists and is a gym business
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: createDto.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Gym tenant not found');
      }

      // TODO: Add business type validation when implemented
      // if (tenant.businessType !== 'gym') {
      //   throw new ForbiddenException('This endpoint is only for gym businesses');
      // }

      return await this.prisma.membershipPlan.create({
        data: {
          ...createDto,
          benefits: createDto.benefits
            ? JSON.stringify(createDto.benefits)
            : undefined,
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
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new ConflictException('Failed to create gym membership plan');
    }
  }

  async findAllByTenant(tenantId: string) {
    // TODO: Add business type validation
    return this.prisma.membershipPlan.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
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
        isActive: true,
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
        tenantId,
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
      throw new NotFoundException('Gym membership plan not found');
    }

    return plan;
  }

  async update(
    id: string,
    tenantId: string,
    updateDto: UpdateMembershipPlanDto,
  ) {
    // Verify the plan exists and belongs to the gym tenant
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
        throw new ConflictException(
          'A gym membership plan with this name already exists for this gym',
        );
      }
    }

    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...updateDto,
        benefits: updateDto.benefits
          ? JSON.stringify(updateDto.benefits)
          : undefined,
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
    // Verify the plan exists and belongs to the gym tenant
    await this.findOne(id, tenantId);

    // Check if any gym members are using this plan (from GymMemberSubscription table)
    const membersWithPlan = await this.prisma.gymMemberSubscription.findFirst({
      where: {
        membershipPlanId: id,
        tenantId,
        member: {
          role: 'GYM_MEMBER',
        },
      },
    });

    if (membersWithPlan) {
      throw new ConflictException(
        'Cannot delete gym membership plan that is currently in use by members',
      );
    }

    // Also check legacy businessData for backward compatibility
    const legacyMembersWithPlan = await this.prisma.user.findFirst({
      where: {
        tenantId,
        role: 'GYM_MEMBER',
        businessData: {
          path: ['membership', 'planId'],
          equals: id,
        },
      },
    });

    if (legacyMembersWithPlan) {
      throw new ConflictException(
        'Cannot delete gym membership plan that is currently in use by members (legacy)',
      );
    }

    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, inactive] = await Promise.all([
      this.prisma.membershipPlan.count({ where: { tenantId } }),
      this.prisma.membershipPlan.count({ where: { tenantId, isActive: true } }),
      this.prisma.membershipPlan.count({
        where: { tenantId, isActive: false },
      }),
    ]);

    // Get usage stats from GymMemberSubscription table (modern approach)
    const modernUsageCount = await this.prisma.gymMemberSubscription.groupBy({
      by: ['membershipPlanId'],
      where: {
        tenantId,
        member: {
          role: 'GYM_MEMBER',
        },
      },
      _count: {
        membershipPlanId: true,
      },
    });

    // Get usage stats from legacy User businessData for backward compatibility
    const legacyMembershipUsage = await this.prisma.user.groupBy({
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
      usageCount: modernUsageCount.length,
      legacyUsageCount: legacyMembershipUsage.length,
    };
  }
}

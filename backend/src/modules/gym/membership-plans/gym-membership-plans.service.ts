import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateGymMembershipPlanDto,
  UpdateGymMembershipPlanRequestDto,
  SoftDeleteGymMembershipPlanDto,
  RestoreGymMembershipPlanDto,
} from './dto/gym-membership-plan.dto';

@Injectable()
export class GymMembershipPlansService {
  private readonly logger = new Logger(GymMembershipPlansService.name);

  constructor(private prisma: PrismaService) {}

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async createGymMembershipPlan(createDto: CreateGymMembershipPlanDto) {
    try {
      // Check if plan name already exists for this gym tenant
      const existingPlan = await this.prisma.gymMembershipPlan.findFirst({
        where: {
          tenantId: createDto.tenantId,
          name: createDto.name,
          deletedAt: null, // Only check non-deleted plans
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

      if (tenant.category !== 'GYM') {
        throw new ForbiddenException('This endpoint is only for gym businesses');
      }

      const createdPlan = await this.prisma.gymMembershipPlan.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          price: createDto.price,
          duration: createDto.duration,
          type: createDto.type,
          isActive: createDto.isActive ?? true,
          tenantId: createDto.tenantId,
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

      this.logger.log(
        `Created gym membership plan: ${createdPlan.name} for tenant ${createdPlan.tenantId}`,
      );

      return {
        success: true,
        data: {
          ...createdPlan,
        benefits: createdPlan.benefits || [],
        },
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to create gym membership plan: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new ConflictException('Failed to create gym membership plan');
    }
  }

  async findAllByTenant(tenantId: string, includeDeleted = false) {
    const whereClause = includeDeleted
      ? { tenantId }
      : { tenantId, deletedAt: null };

    const plans = await this.prisma.gymMembershipPlan.findMany({
      where: whereClause,
      orderBy: [
        { deletedAt: 'asc' }, // Non-deleted first
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
        deletedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get member counts for each plan
    const planIds = plans.map(plan => plan.id);
    
    // Count from gym member subscriptions using new relation
    const subscriptionCounts = await this.prisma.gymMemberSubscription.groupBy({
      by: ['gymMembershipPlanId'],
      where: {
        gymMembershipPlanId: { in: planIds },
        tenantId,
        status: 'ACTIVE',
        cancelledAt: null,
      },
      _count: {
        gymMembershipPlanId: true,
      },
    });

    // Create member count map
    const memberCountMap = new Map<string, number>();
    subscriptionCounts.forEach((count) => {
      if (count.gymMembershipPlanId) {
        memberCountMap.set(count.gymMembershipPlanId, count._count.gymMembershipPlanId);
      }
    });

    return {
      success: true,
      data: plans.map((plan) => ({
        ...plan,
        benefits: plan.benefits || [],
        memberCount: memberCountMap.get(plan.id) || 0,
        isDeleted: !!plan.deletedAt,
      })),
    };
  }

  async findAllActive(tenantId: string) {
    const result = await this.findAllByTenant(tenantId, false);
    return {
      success: true,
      data: result.data.filter(plan => plan.isActive),
    };
  }

  async findOne(id: string, tenantId: string, includeDeleted = false) {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid plan ID format');
    }

    const whereClause = includeDeleted
      ? { id, tenantId }
      : { id, tenantId, deletedAt: null };

    const plan = await this.prisma.gymMembershipPlan.findFirst({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Gym membership plan not found');
    }

    // Get member count
    const memberCount = await this.prisma.gymMemberSubscription.count({
      where: {
        gymMembershipPlanId: plan.id,
        tenantId,
        status: 'ACTIVE',
        cancelledAt: null,
      },
    });

    return {
      success: true,
      data: {
        ...plan,
        benefits: plan.benefits || [],
        memberCount,
        isDeleted: !!plan.deletedAt,
      },
    };
  }

  async update(
    id: string,
    tenantId: string,
    updateDto: UpdateGymMembershipPlanRequestDto,
  ) {
    // Verify the plan exists and belongs to the gym tenant
    const existingPlan = await this.findOne(id, tenantId);

    if (existingPlan.data.isDeleted) {
      throw new BadRequestException('Cannot update a deleted membership plan');
    }

    // Check for name conflicts if name is being updated
    if (updateDto.name && updateDto.name !== existingPlan.data.name) {
      const conflictingPlan = await this.prisma.gymMembershipPlan.findFirst({
        where: {
          tenantId,
          name: updateDto.name,
          deletedAt: null,
          id: { not: id }, // Exclude current plan
        },
      });

      if (conflictingPlan) {
        throw new ConflictException(
          'A gym membership plan with this name already exists for this gym',
        );
      }
    }

    const updatedPlan = await this.prisma.gymMembershipPlan.update({
      where: { id },
      data: {
        ...updateDto,
        benefits: updateDto.benefits
          ? JSON.stringify(updateDto.benefits)
          : undefined,
        updatedAt: new Date(),
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

    this.logger.log(
      `Updated gym membership plan: ${updatedPlan.name} (${id})`,
    );

    return {
      success: true,
      data: {
        ...updatedPlan,
        benefits: updatedPlan.benefits
          ? JSON.parse(updatedPlan.benefits as string)
          : [],
      },
    };
  }

  async toggleStatus(id: string, tenantId: string) {
    const plan = await this.findOne(id, tenantId);

    if (plan.data.isDeleted) {
      throw new BadRequestException('Cannot toggle status of a deleted membership plan');
    }

    const updatedPlan = await this.prisma.gymMembershipPlan.update({
      where: { id },
      data: { 
        isActive: !plan.data.isActive,
        updatedAt: new Date(),
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

    this.logger.log(
      `Toggled status for gym membership plan: ${updatedPlan.name} (${id}) to ${updatedPlan.isActive ? 'active' : 'inactive'}`,
    );

    return {
      success: true,
      data: {
        ...updatedPlan,
        benefits: updatedPlan.benefits
          ? JSON.parse(updatedPlan.benefits as string)
          : [],
      },
    };
  }

  async softDelete(
    id: string,
    tenantId: string,
    deletedBy: string,
    deleteDto: SoftDeleteGymMembershipPlanDto,
  ) {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid plan ID format');
      }

      if (!this.isValidUUID(deletedBy)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Verify the plan exists and is not already deleted
      const existingPlan = await this.findOne(id, tenantId, false);

      if (existingPlan.data.isDeleted) {
        throw new BadRequestException('Membership plan is already deleted');
      }

      // Check if any active subscriptions are using this plan
      const activeSubscriptions = await this.prisma.gymMemberSubscription.findFirst({
        where: {
          gymMembershipPlanId: id,
          tenantId,
          status: 'ACTIVE',
          cancelledAt: null,
        },
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (activeSubscriptions) {
        throw new ConflictException(
          `Cannot delete gym membership plan that has active subscriptions. Member: ${activeSubscriptions.member.firstName} ${activeSubscriptions.member.lastName} (${activeSubscriptions.member.email}) has an active subscription using this plan.`,
        );
      }

      // Soft delete the plan
      const deletedPlan = await this.prisma.gymMembershipPlan.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy,
          deleteReason: deleteDto.reason,
          deleteNotes: deleteDto.notes,
          isActive: false, // Also deactivate when deleting
          updatedAt: new Date(),
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          deletedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(
        `Soft deleted gym membership plan: ${deletedPlan.name} (${id}) by user ${deletedBy}`,
      );

      return {
        success: true,
        message: 'Membership plan deleted successfully',
        data: {
          ...deletedPlan,
          benefits: deletedPlan.benefits
            ? JSON.parse(deletedPlan.benefits as string)
            : [],
          isDeleted: true,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to soft delete gym membership plan ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete membership plan. Please try again.',
      );
    }
  }

  async restore(
    id: string,
    tenantId: string,
    restoredBy: string,
    restoreDto: RestoreGymMembershipPlanDto,
  ) {
    try {
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid plan ID format');
      }

      if (!this.isValidUUID(restoredBy)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Verify the plan exists and is deleted
      const existingPlan = await this.findOne(id, tenantId, true);

      if (!existingPlan.data.isDeleted) {
        throw new BadRequestException('Membership plan is not deleted');
      }

      // Check for name conflicts with non-deleted plans
      const conflictingPlan = await this.prisma.gymMembershipPlan.findFirst({
        where: {
          tenantId,
          name: existingPlan.data.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (conflictingPlan) {
        throw new ConflictException(
          'Cannot restore: A membership plan with this name already exists',
        );
      }

      // Restore the plan
      const restoredPlan = await this.prisma.gymMembershipPlan.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: null,
          deleteReason: null,
          deleteNotes: null,
          isActive: true, // Reactivate when restoring
          updatedAt: new Date(),
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

      this.logger.log(
        `Restored gym membership plan: ${restoredPlan.name} (${id}) by user ${restoredBy}`,
      );

      return {
        success: true,
        message: 'Membership plan restored successfully',
        data: {
          ...restoredPlan,
          benefits: restoredPlan.benefits
            ? JSON.parse(restoredPlan.benefits as string)
            : [],
          isDeleted: false,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to restore gym membership plan ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to restore membership plan. Please try again.',
      );
    }
  }

  // Hard delete - only for development/cleanup purposes
  async hardDelete(id: string, tenantId: string) {
    // Verify the plan exists and belongs to the gym tenant
    await this.findOne(id, tenantId, true);

    return await this.prisma.gymMembershipPlan.delete({
      where: { id },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, inactive, deleted] = await Promise.all([
      this.prisma.gymMembershipPlan.count({ where: { tenantId } }),
      this.prisma.gymMembershipPlan.count({ 
        where: { tenantId, isActive: true, deletedAt: null } 
      }),
      this.prisma.gymMembershipPlan.count({
        where: { tenantId, isActive: false, deletedAt: null },
      }),
      this.prisma.gymMembershipPlan.count({
        where: { tenantId, deletedAt: { not: null } },
      }),
    ]);

    // Get usage stats from GymMemberSubscription table
    const usageCount = await this.prisma.gymMemberSubscription.groupBy({
      by: ['gymMembershipPlanId'],
      where: {
        tenantId,
        gymMembershipPlanId: { not: null as any },
        status: 'ACTIVE',
      },
      _count: {
        gymMembershipPlanId: true,
      },
    });

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        deleted,
        usageCount: usageCount.length,
      },
    };
  }
}
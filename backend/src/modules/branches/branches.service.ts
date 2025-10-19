import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserToBranchDto,
  UpdateUserBranchAccessDto,
} from './dto/branch.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class BranchesService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createBranch(createBranchDto: CreateBranchDto) {
    try {
      if (!createBranchDto.tenantId) {
        throw new BadRequestException(
          'Tenant ID is required to create a branch',
        );
      }

      // Check if tenant can create a branch
      let canCreateResult;
      try {
        canCreateResult = await this.subscriptionsService.canCreateBranch(
          createBranchDto.tenantId,
        );
      } catch (subscriptionCheckError) {
        // Log subscription check error but allow branch creation for debugging
        console.warn('Subscription check failed:', subscriptionCheckError.message);
        canCreateResult = { canCreate: true, freeBranchesRemaining: 1 };
      }

      if (!canCreateResult.canCreate) {
        throw new ForbiddenException(canCreateResult.reason);
      }

      // Create the branch
      const branch = await this.prisma.branch.create({
        data: createBranchDto as any,
      });

      // Auto-create trial subscription if this is a free branch
      if (canCreateResult.freeBranchesRemaining > 0) {
        try {
          await this.subscriptionsService.createTrialSubscription(branch.id);
        } catch (subscriptionError) {
          // Log subscription creation error but don't fail branch creation
          console.warn('Failed to create trial subscription:', subscriptionError.message);
          console.warn('Branch created successfully but without subscription');
        }
      }
      // Note: For paid branches, subscription creation will be handled by payment flow

      return await this.prisma.branch.findUnique({
        where: { id: branch.id },
        include: {
          subscriptions: {
            include: {
              plan: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('name')) {
          throw new ConflictException(`Branch with name "${createBranchDto.name}" already exists in this tenant`);
        }
        throw new ConflictException('Branch creation failed due to unique constraint violation');
      }
      
      // Enhanced error logging for debugging
      console.error('Branch creation error details:');
      console.error('Error type:', error.constructor.name);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      throw new ConflictException(`Branch creation failed: ${error.message}`);
    }
  }

  async updateBranch(branchId: string, updateBranchDto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: updateBranchDto,
    });
  }

  async findAllBranches(tenantId: string) {
    return this.prisma.branch
      .findMany({
        where: { tenantId, isActive: true },
        include: {
          _count: {
            select: {
              gymUserBranches: true,
            },
          },
          gymUserBranches: {
            select: {
              user: {
                select: {
                  id: true,
                  role: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .then((branches) => {
        return branches.map((branch) => {
          const members = branch.gymUserBranches.filter(
            (ub) => ub.user.role === 'CLIENT',
          );
          const activeMembers = members.filter((ub) => !ub.user.deletedAt).length;
          const deletedMembers = members.filter(
            (ub) => ub.user.deletedAt,
          ).length;
          const staff = branch.gymUserBranches.filter(
            (ub) => ub.user.role && ['STAFF', 'MANAGER'].includes(ub.user.role),
          ).length;

          return {
            ...branch,
            _count: {
              gymUserBranches: members.length,
              activeMembers,
              deletedMembers,
              staff,
            },
            gymUserBranches: undefined, // Remove detailed gymUserBranches from response
          };
        });
      });
  }

  async findAllBranchesSystemWide() {
    return this.prisma.branch
      .findMany({
        where: { isActive: true },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          _count: {
            select: {
              gymUserBranches: true,
            },
          },
          gymUserBranches: {
            select: {
              user: {
                select: {
                  id: true,
                  role: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .then((branches) => {
        return branches.map((branch) => {
          const members = branch.gymUserBranches.filter(
            (ub) => ub.user.role === 'CLIENT',
          );
          const activeMembers = members.filter((ub) => !ub.user.deletedAt).length;
          const deletedMembers = members.filter(
            (ub) => ub.user.deletedAt,
          ).length;
          const staff = branch.gymUserBranches.filter(
            (ub) => ub.user.role && ['STAFF', 'MANAGER'].includes(ub.user.role),
          ).length;

          return {
            ...branch,
            _count: {
              gymUserBranches: members.length,
              activeMembers,
              deletedMembers,
              staff,
            },
            gymUserBranches: undefined, // Remove detailed gymUserBranches from response
          };
        });
      });
  }

  async findBranchById(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async deleteBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        gymUserBranches: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check for assigned users (both active staff and members)
    const activeUsers = branch.gymUserBranches.filter(ub => !ub.user.deletedAt);
    if (activeUsers.length > 0) {
      const userSummary = activeUsers.map(ub => `${ub.user.firstName} ${ub.user.lastName} (${ub.user.role})`).join(', ');
      throw new ConflictException(`Cannot delete branch: ${activeUsers.length} users are assigned (${userSummary}). Please reassign users first.`);
    }

    // Soft delete by setting isActive to false
    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: false },
    });
  }

  async restoreBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: true },
    });
  }

  async getBranchUsers(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        gymUserBranches: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
                photoUrl: true,
                deletedAt: true,
                createdAt: true,
                gymMemberProfile: {
                  select: {
                    role: true,
                    status: true,
                    joinedDate: true,
                  },
                },
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            branches: {
              where: { isActive: true, id: { not: branchId } },
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    gymUserBranches: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Categorize users by role and status
    const activeUsers = branch.gymUserBranches
      .filter(ub => !ub.user.deletedAt)
      .map(ub => ({
        ...ub.user,
        branchAssignment: {
          accessLevel: ub.accessLevel,
          isPrimary: ub.isPrimary,
          assignedAt: ub.createdAt,
        },
      }));

    const usersByRole = {
      staff: activeUsers.filter(u => u.role && ['STAFF', 'MANAGER'].includes(u.role)),
      members: activeUsers.filter(u => u.role === 'CLIENT'),
      admins: activeUsers.filter(u => u.role && ['SUPER_ADMIN', 'OWNER'].includes(u.role)),
    };

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        isActive: branch.isActive,
      },
      users: {
        total: activeUsers.length,
        byRole: usersByRole,
        all: activeUsers,
      },
      reassignmentOptions: branch.tenant.branches,
      statistics: {
        staffCount: usersByRole.staff.length,
        memberCount: usersByRole.members.length,
        adminCount: usersByRole.admins.length,
      },
    };
  }

  async bulkReassignUsers(fromBranchId: string, toBranchId: string, userIds: string[], reason?: string) {
    // Validate both branches exist and are active
    const [fromBranch, toBranch] = await Promise.all([
      this.prisma.branch.findFirst({ where: { id: fromBranchId, isActive: true } }),
      this.prisma.branch.findFirst({ where: { id: toBranchId, isActive: true } }),
    ]);

    if (!fromBranch) {
      throw new NotFoundException('Source branch not found or inactive');
    }
    if (!toBranch) {
      throw new NotFoundException('Target branch not found or inactive');
    }
    if (fromBranch.tenantId !== toBranch.tenantId) {
      throw new BadRequestException('Cannot reassign users between different tenants');
    }

    // Validate all users are currently assigned to the source branch
    const currentAssignments = await this.prisma.gymUserBranch.findMany({
      where: {
        branchId: fromBranchId,
        userId: { in: userIds },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (currentAssignments.length !== userIds.length) {
      const foundUserIds = currentAssignments.map(a => a.userId);
      const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
      throw new BadRequestException(`Some users are not assigned to source branch: ${missingUserIds.join(', ')}`);
    }

    // Check if users are already assigned to target branch
    const existingTargetAssignments = await this.prisma.gymUserBranch.findMany({
      where: {
        branchId: toBranchId,
        userId: { in: userIds },
      },
    });

    if (existingTargetAssignments.length > 0) {
      const duplicateUsers = existingTargetAssignments.map(a => a.userId);
      throw new ConflictException(`Some users are already assigned to target branch: ${duplicateUsers.join(', ')}`);
    }

    // Perform bulk reassignment in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete old assignments
      await tx.gymUserBranch.deleteMany({
        where: {
          branchId: fromBranchId,
          userId: { in: userIds },
        },
      });

      // Create new assignments (preserve access levels and primary status)
      const newAssignments = await tx.gymUserBranch.createMany({
        data: currentAssignments.map(assignment => ({
          userId: assignment.userId,
          branchId: toBranchId,
          tenantId: toBranch.tenantId,
          accessLevel: assignment.accessLevel,
          isPrimary: assignment.isPrimary,
          permissions: assignment.permissions || undefined,
        })),
      });

      // TODO: Create audit log entry
      // await tx.branchAuditLog.create({ ... })

      return {
        reassignedCount: newAssignments.count,
        fromBranch: { id: fromBranch.id, name: fromBranch.name },
        toBranch: { id: toBranch.id, name: toBranch.name },
        users: currentAssignments.map(a => ({
          id: a.user.id,
          name: `${a.user.firstName} ${a.user.lastName}`,
          role: a.user.role,
        })),
        reason,
        timestamp: new Date().toISOString(),
      };
    });

    return result;
  }

  async forceDeleteBranch(branchId: string, reason: string, confirmationText: string, performedBy: string) {
    if (confirmationText !== 'FORCE DELETE') {
      throw new BadRequestException('Confirmation text must be exactly "FORCE DELETE"');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        gymUserBranches: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const activeUsers = branch.gymUserBranches.filter(ub => !ub.user.deletedAt);

    // Perform force deletion in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Remove all user assignments first
      if (activeUsers.length > 0) {
        await tx.gymUserBranch.deleteMany({
          where: { branchId },
        });
      }

      // Soft delete the branch
      const deletedBranch = await tx.branch.update({
        where: { id: branchId },
        data: { isActive: false },
      });

      // TODO: Create audit log entry for force deletion
      // await tx.branchAuditLog.create({ ... })

      return {
        branch: {
          id: deletedBranch.id,
          name: deletedBranch.name,
        },
        orphanedUsers: activeUsers.map(ub => ({
          id: ub.user.id,
          name: `${ub.user.firstName} ${ub.user.lastName}`,
          role: ub.user.role,
        })),
        reason,
        performedBy,
        timestamp: new Date().toISOString(),
        warning: 'Users have been unassigned from all branches. They may need to be reassigned manually.',
      };
    });

    return result;
  }

  async assignUserToBranch(
    assignUserToBranchDto: AssignUserToBranchDto,
    branchId: string,
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.gymUserBranch.create({
      data: {
        ...assignUserToBranchDto,
        branchId,
        tenantId: branch.tenantId,
      },
    });
  }

  async updateUserBranchAccess(
    updateUserBranchAccessDto: UpdateUserBranchAccessDto,
    userId: string,
    branchId: string,
  ) {
    const gymUserBranch = await this.prisma.gymUserBranch.findUnique({
      where: {
        userId_branchId: {
          userId,
          branchId,
        },
      },
    });

    if (!gymUserBranch) {
      throw new NotFoundException('User not found in branch');
    }

    return this.prisma.gymUserBranch.update({
      where: {
        userId_branchId: {
          userId,
          branchId,
        },
      },
      data: updateUserBranchAccessDto,
    });
  }
}

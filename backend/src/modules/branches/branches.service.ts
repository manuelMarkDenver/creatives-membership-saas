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

      // Handle main branch logic
      if (createBranchDto.isMainBranch) {
        // Check if there's already a main branch
        const existingMainBranch = await this.prisma.branch.findFirst({
          where: {
            tenantId: createBranchDto.tenantId,
            isMainBranch: true,
            isActive: true,
          },
        });

        if (existingMainBranch) {
          throw new ConflictException(
            `Cannot set as main branch. "${existingMainBranch.name}" is already the main branch. ` +
            `Please unset the existing main branch first.`,
          );
        }
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

    // Handle main branch swap logic
    if (updateBranchDto.isMainBranch === true && !branch.isMainBranch) {
      // Check if there's already a main branch
      const existingMainBranch = await this.prisma.branch.findFirst({
        where: {
          tenantId: branch.tenantId,
          isMainBranch: true,
          isActive: true,
          id: { not: branchId },
        },
      });

      if (existingMainBranch) {
        // Use transaction to swap main branch status
        return this.prisma.$transaction(async (tx) => {
          // Unset existing main branch
          await tx.branch.update({
            where: { id: existingMainBranch.id },
            data: { isMainBranch: false },
          });

          // Set new main branch
          return tx.branch.update({
            where: { id: branchId },
            data: updateBranchDto,
          });
        });
      }
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: updateBranchDto,
    });
  }

  async findAllBranches(tenantId: string, includeDeleted = false) {
    const branches = await this.prisma.branch.findMany({
      where: includeDeleted ? { tenantId } : { tenantId, isActive: true },
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
    });

    // Get all members with primaryBranchId for these branches
    // ONLY count CLIENT role users (exclude OWNER, MANAGER, STAFF until Staff Management is implemented)
    const branchIds = branches.map(b => b.id);
    const membersWithPrimaryBranch = await this.prisma.gymMemberProfile.groupBy({
      by: ['primaryBranchId'],
      where: {
        primaryBranchId: { in: branchIds },
        user: {
          deletedAt: null,
          role: 'CLIENT', // Only count CLIENT role users (gym members)
        },
      },
      _count: {
        primaryBranchId: true,
      },
    });

    const primaryBranchCounts = new Map(
      membersWithPrimaryBranch.map(item => [item.primaryBranchId, item._count.primaryBranchId])
    );

    return branches.map((branch) => {
      const membersFromBranches = branch.gymUserBranches.filter(
        (ub) => ub.user.role === 'CLIENT',
      );
      const activeMembersFromBranches = membersFromBranches.filter((ub) => !ub.user.deletedAt).length;
      const deletedMembers = membersFromBranches.filter(
        (ub) => ub.user.deletedAt,
      ).length;
      const staff = branch.gymUserBranches.filter(
        (ub) => ub.user.role && ['STAFF', 'MANAGER', 'OWNER'].includes(ub.user.role),
      ).length;

      // Members with primaryBranchId set to this branch (count is already from groupBy)
      const membersWithPrimaryBranchCount = primaryBranchCounts.get(branch.id) || 0;
      
      // Total members = sum of both sources (primaryBranchId members are NOT in gymUserBranches table by design)
      // No double-counting because primaryBranchId members don't have gymUserBranch records
      const totalMembers = activeMembersFromBranches + membersWithPrimaryBranchCount;

      return {
        ...branch,
        _count: {
          gymUserBranches: totalMembers,
          activeMembers: totalMembers,
          deletedMembers,
          staff,
        },
        gymUserBranches: undefined, // Remove detailed gymUserBranches from response
      };
    });
  }

  async findAllBranchesSystemWide(includeDeleted = false) {
    const branches = await this.prisma.branch.findMany({
      where: includeDeleted ? {} : { isActive: true },
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
    });

    // Get all members with primaryBranchId for these branches
    // ONLY count CLIENT role users (exclude OWNER, MANAGER, STAFF until Staff Management is implemented)
    const branchIds = branches.map(b => b.id);
    const membersWithPrimaryBranch = await this.prisma.gymMemberProfile.groupBy({
      by: ['primaryBranchId'],
      where: {
        primaryBranchId: { in: branchIds },
        user: {
          deletedAt: null,
          role: 'CLIENT', // Only count CLIENT role users (gym members)
        },
      },
      _count: {
        primaryBranchId: true,
      },
    });

    const primaryBranchCounts = new Map(
      membersWithPrimaryBranch.map(item => [item.primaryBranchId, item._count.primaryBranchId])
    );

    return branches.map((branch) => {
      const membersFromBranches = branch.gymUserBranches.filter(
        (ub) => ub.user.role === 'CLIENT',
      );
      const activeMembersFromBranches = membersFromBranches.filter((ub) => !ub.user.deletedAt).length;
      const deletedMembers = membersFromBranches.filter(
        (ub) => ub.user.deletedAt,
      ).length;
      const staff = branch.gymUserBranches.filter(
        (ub) => ub.user.role && ['STAFF', 'MANAGER', 'OWNER'].includes(ub.user.role),
      ).length;

      // Members with primaryBranchId set to this branch (count is already from groupBy)
      const membersWithPrimaryBranchCount = primaryBranchCounts.get(branch.id) || 0;
      
      // Total members = sum of both sources (primaryBranchId members are NOT in gymUserBranches table by design)
      // No double-counting because primaryBranchId members don't have gymUserBranch records
      const totalMembers = activeMembersFromBranches + membersWithPrimaryBranchCount;

      return {
        ...branch,
        _count: {
          gymUserBranches: totalMembers,
          activeMembers: totalMembers,
          deletedMembers,
          staff,
        },
        gymUserBranches: undefined, // Remove detailed gymUserBranches from response
      };
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

    // Check if this is the last active branch in the tenant
    const activeBranchCount = await this.prisma.branch.count({
      where: {
        tenantId: branch.tenantId,
        isActive: true,
      },
    });
    
    if (activeBranchCount <= 1) {
      throw new ConflictException(
        'Cannot delete the last branch. Each tenant must have at least one active location.'
      );
    }

    // Check for assigned users via gymUserBranches (staff and some members)
    const activeUsers = branch.gymUserBranches.filter(ub => !ub.user.deletedAt);
    
    // Also check for gym members with this as their primary branch
    const membersWithPrimaryBranch = await this.prisma.gymMemberProfile.findMany({
      where: {
        primaryBranchId: branchId,
        user: {
          deletedAt: null, // Only active members
        },
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
    
    const totalAssignedUsers = activeUsers.length + membersWithPrimaryBranch.length;
    
    if (totalAssignedUsers > 0) {
      const userSummaries: string[] = [];
      
      // Add gymUserBranches users
      activeUsers.forEach(ub => {
        userSummaries.push(`${ub.user.firstName} ${ub.user.lastName} (${ub.user.role})`);
      });
      
      // Add primary branch members
      membersWithPrimaryBranch.forEach(profile => {
        userSummaries.push(`${profile.user.firstName} ${profile.user.lastName} (${profile.user.role})`);
      });
      
      throw new ConflictException(
        `Cannot delete branch: ${totalAssignedUsers} users are assigned (${userSummaries.join(', ')}). Please reassign users first.`
      );
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

    if (branch.isActive) {
      throw new ConflictException('Branch is already active');
    }

    // Check if tenant can restore (create) this branch
    const canCreateResult = await this.subscriptionsService.canCreateBranch(
      branch.tenantId,
    );

    if (!canCreateResult.canCreate) {
      throw new ForbiddenException(
        `Cannot restore branch: ${canCreateResult.reason}`,
      );
    }

    // Check for main branch conflict
    await this.validateMainBranchConflict(branch);

    return this.prisma.branch.update({
      where: { id: branchId },
      data: { isActive: true },
    });
  }

  private async validateMainBranchConflict(branchToRestore: any) {
    // Check if this branch would be considered a main branch
    const isMainBranch = this.isMainBranch(branchToRestore);
    
    if (isMainBranch) {
      // Check if there's already an active main branch
      const activeBranches = await this.prisma.branch.findMany({
        where: { 
          tenantId: branchToRestore.tenantId, 
          isActive: true 
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Check if any active branch is already a main branch
      const existingMainBranch = activeBranches.find(branch => this.isMainBranch(branch));
      
      if (existingMainBranch) {
        throw new ConflictException(
          `Cannot restore "${branchToRestore.name}" as it would create multiple main branches. ` +
          `"${existingMainBranch.name}" is already the main branch. ` +
          `Please rename one of them to avoid conflict.`
        );
      }
    }
  }

  private isMainBranch(branch: any): boolean {
    const mainKeywords = ['main', 'primary', 'headquarters', 'head office', 'central'];
    const branchName = branch.name.toLowerCase();
    return mainKeywords.some(keyword => branchName.includes(keyword));
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

    // Get users from gymUserBranches
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

    // Also get gym members with this as their primary branch
    const membersWithPrimaryBranch = await this.prisma.gymMemberProfile.findMany({
      where: {
        primaryBranchId: branchId,
        user: {
          deletedAt: null,
        },
      },
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
          },
        },
      },
    });

    // Add primary branch members to the list (if not already in gymUserBranches)
    const userIdsInBranches = new Set(activeUsers.map(u => u.id));
    const additionalMembers = membersWithPrimaryBranch
      .filter(profile => !userIdsInBranches.has(profile.user.id))
      .map(profile => ({
        ...profile.user,
        branchAssignment: {
          accessLevel: 'READ_ONLY',
          isPrimary: true,
          assignedAt: profile.createdAt,
        },
        gymMemberProfile: {
          role: profile.role,
          status: profile.status,
          joinedDate: profile.joinedDate,
        },
      }));

    const allActiveUsers = [...activeUsers, ...additionalMembers];

    const usersByRole = {
      staff: allActiveUsers.filter(u => u.role && ['STAFF', 'MANAGER'].includes(u.role)),
      members: allActiveUsers.filter(u => u.role === 'CLIENT'),
      admins: allActiveUsers.filter(u => u.role && ['SUPER_ADMIN', 'OWNER'].includes(u.role)),
    };

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        isActive: branch.isActive,
      },
      users: {
        total: allActiveUsers.length,
        byRole: usersByRole,
        all: allActiveUsers,
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

    // Get users assigned via gymUserBranch table
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

    // Get members with this as their primary branch (not in gymUserBranch)
    const membersWithPrimaryBranch = await this.prisma.gymMemberProfile.findMany({
      where: {
        primaryBranchId: fromBranchId,
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

    const foundUserIds = new Set([
      ...currentAssignments.map(a => a.userId),
      ...membersWithPrimaryBranch.map(p => p.userId),
    ]);

    const missingUserIds = userIds.filter(id => !foundUserIds.has(id));
    if (missingUserIds.length > 0) {
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
      let reassignedCount = 0;

      // Handle users in gymUserBranch table
      if (currentAssignments.length > 0) {
        // Delete old assignments
        await tx.gymUserBranch.deleteMany({
          where: {
            branchId: fromBranchId,
            userId: { in: currentAssignments.map(a => a.userId) },
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
        reassignedCount += newAssignments.count;
      }

      // Update primaryBranchId for all gym members (both in gymUserBranch and only primaryBranch)
      const allMemberUserIds = [
        ...currentAssignments.filter(a => a.user.role === 'CLIENT').map(a => a.userId),
        ...membersWithPrimaryBranch.map(p => p.userId),
      ];
      
      if (allMemberUserIds.length > 0) {
        const updateResult = await tx.gymMemberProfile.updateMany({
          where: {
            userId: { in: allMemberUserIds },
          },
          data: {
            primaryBranchId: toBranchId,
          },
        });
        // Add members that were only in primaryBranch (not in gymUserBranch)
        reassignedCount += membersWithPrimaryBranch.length;
      }

      // TODO: Create audit log entry
      // await tx.branchAuditLog.create({ ... })

      const allUsers = [
        ...currentAssignments.map(a => ({
          id: a.user.id,
          name: `${a.user.firstName} ${a.user.lastName}`,
          role: a.user.role,
        })),
        ...membersWithPrimaryBranch.map(p => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          role: p.user.role,
        })),
      ];

      return {
        reassignedCount,
        fromBranch: { id: fromBranch.id, name: fromBranch.name },
        toBranch: { id: toBranch.id, name: toBranch.name },
        users: allUsers,
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

    // Check if this is the last active branch in the tenant
    const activeBranchCount = await this.prisma.branch.count({
      where: {
        tenantId: branch.tenantId,
        isActive: true,
      },
    });
    
    if (activeBranchCount <= 1) {
      throw new ConflictException(
        'Cannot delete the last branch. Each tenant must have at least one active location.'
      );
    }

    const activeUsers = branch.gymUserBranches.filter(ub => !ub.user.deletedAt);

    // Get fallback branch for member reassignment (first active branch in tenant)
    const fallbackBranch = await this.prisma.branch.findFirst({
      where: {
        tenantId: branch.tenantId,
        isActive: true,
        id: { not: branchId }, // Exclude the branch being deleted
      },
      orderBy: { createdAt: 'asc' }, // Use oldest branch (likely the main branch)
    });

    // Perform force deletion in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Get members whose primary branch is being deleted
      const membersToReassign = await tx.gymMemberProfile.findMany({
        where: { primaryBranchId: branchId },
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

      // Reassign members to fallback branch or set to null
      if (membersToReassign.length > 0) {
        await tx.gymMemberProfile.updateMany({
          where: { primaryBranchId: branchId },
          data: { primaryBranchId: fallbackBranch?.id || null },
        });
      }

      // Remove all user assignments
      if (activeUsers.length > 0) {
        await tx.gymUserBranch.deleteMany({
          where: { branchId },
        });
      }

      // Soft delete the branch
      const deletedBranch = await tx.branch.update({
        where: { id: branchId },
        data: { isActive: false, deletedBy: performedBy, deletedAt: new Date() },
      });

      // TODO: Create audit log entry for force deletion
      // await tx.branchAuditLog.create({ ... })

      return {
        branch: {
          id: deletedBranch.id,
          name: deletedBranch.name,
        },
        reassignedMembers: membersToReassign.map(m => ({
          id: m.user.id,
          name: `${m.user.firstName} ${m.user.lastName}`,
          role: m.user.role,
          newBranch: fallbackBranch ? { id: fallbackBranch.id, name: fallbackBranch.name } : null,
        })),
        orphanedUsers: activeUsers.map(ub => ({
          id: ub.user.id,
          name: `${ub.user.firstName} ${ub.user.lastName}`,
          role: ub.user.role,
        })),
        reason,
        performedBy,
        timestamp: new Date().toISOString(),
        warning: fallbackBranch 
          ? `${membersToReassign.length} members automatically reassigned to "${fallbackBranch.name}"`
          : 'WARNING: No active branches available. Members have been left without a primary branch and will need manual reassignment.',
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

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateUserBranchDto,
  UpdateUserBranchDto,
} from './dto/user-branch.dto';

@Injectable()
export class UserBranchesService {
  private readonly logger = new Logger(UserBranchesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get user-branch assignments with optional filters
   */
  async getUserBranchAssignments(filters: {
    tenantId?: string;
    branchId?: string;
    userId?: string;
  }) {
    try {
      const whereClause: any = {};

      if (filters.tenantId) {
        whereClause.user = { tenantId: filters.tenantId };
      }

      if (filters.branchId) {
        whereClause.branchId = filters.branchId;
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

       const assignments = await this.prisma.gymUserBranch.findMany({
         where: whereClause,
         include: {
           user: {
             select: {
               id: true,
               firstName: true,
               lastName: true,
               email: true,
              role: true,
              isActive: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { user: { firstName: 'asc' } }],
      });

      return assignments;
    } catch (error) {
      this.logger.error(
        `Failed to get user-branch assignments: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get branch assignments for a specific user
   */
  async getUserBranches(userId: string, currentUser: any) {
    try {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, tenantId: true, role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (user.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException(
            'Access denied to user from different tenant',
          );
        }
      }

      const gymUserBranches = await this.prisma.gymUserBranch.findMany({
        where: { userId },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
              isActive: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { branch: { name: 'asc' } }],
      });

      return {
        userId,
        branchAssignments: gymUserBranches,
        totalBranches: gymUserBranches.length,
        primaryBranch: gymUserBranches.find((ub) => ub.isPrimary),
      };
    } catch (error) {
      this.logger.error(`Failed to get user branches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get users assigned to a specific branch
   */
  async getBranchUsers(branchId: string, currentUser: any) {
    try {
      // Validate branch exists and user has access
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true, name: true, tenantId: true },
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (branch.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException(
            'Access denied to branch from different tenant',
          );
        }

        // Managers can only see branches they have access to
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await this.prisma.gymUserBranch.findFirst({
            where: {
              userId: currentUser.id,
              branchId: branchId,
            },
          });

          if (!hasAccess) {
            throw new ForbiddenException('Access denied to this branch');
          }
        }
      }

      const branchUsers = await this.prisma.gymUserBranch.findMany({
        where: { branchId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { isPrimary: 'desc' },
          { accessLevel: 'asc' },
          { user: { firstName: 'asc' } },
        ],
      });

      return {
        branchId,
        branchName: branch.name,
        userAssignments: branchUsers,
        totalUsers: branchUsers.length,
        managers: branchUsers.filter(
          (ub) => ub.accessLevel === 'MANAGER_ACCESS',
        ),
        staff: branchUsers.filter((ub) => ub.accessLevel === 'STAFF_ACCESS'),
      };
    } catch (error) {
      this.logger.error(`Failed to get branch users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign user to a branch
   */
  async assignUserToBranch(
    createUserBranchDto: CreateUserBranchDto,
    currentUser: any,
  ) {
    try {
      const { userId, branchId, accessLevel, isPrimary, permissions } =
        createUserBranchDto;

      // Validate user and branch exist
      const [user, branch] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            tenantId: true,
          },
        }),
        this.prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true, name: true, tenantId: true },
        }),
      ]);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      // Check if user and branch are in the same tenant
      if (user.tenantId !== branch.tenantId) {
        throw new BadRequestException(
          'User and branch must be in the same tenant',
        );
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (branch.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException(
            'Access denied to branch from different tenant',
          );
        }

        // Only OWNER can assign MANAGER level access
        if (accessLevel === 'MANAGER_ACCESS' && currentUser.role !== 'OWNER') {
          throw new ForbiddenException('Only owners can assign manager access');
        }

        // MANAGER can only assign STAFF to branches they have access to
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await this.prisma.gymUserBranch.findFirst({
            where: {
              userId: currentUser.id,
              branchId: branchId,
              accessLevel: 'MANAGER_ACCESS',
            },
          });

          if (!hasAccess) {
            throw new ForbiddenException(
              'You can only assign staff to branches you manage',
            );
          }
        }
      }

      // Check if assignment already exists
      const existingAssignment = await this.prisma.gymUserBranch.findUnique({
        where: {
          userId_branchId: {
            userId,
            branchId,
          },
        },
      });

      if (existingAssignment) {
        throw new BadRequestException(
          'User is already assigned to this branch',
        );
      }

      // If this is primary, remove primary from other assignments for this user
      if (isPrimary) {
        await this.prisma.gymUserBranch.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Create assignment
      const assignment = await this.prisma.gymUserBranch.create({
        data: {
          userId,
          branchId,
        tenantId: user.tenantId,
          accessLevel: accessLevel || 'STAFF_ACCESS',
          isPrimary: isPrimary || false,
          permissions,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      this.logger.log(
        `Assigned ${user.firstName} ${user.lastName} to branch ${branch.name} with ${accessLevel} access`,
      );

      return assignment;
    } catch (error) {
      this.logger.error(`Failed to assign user to branch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user-branch assignment
   */
  async updateUserBranchAssignment(
    id: string,
    updateUserBranchDto: UpdateUserBranchDto,
    currentUser: any,
  ) {
    try {
      const { accessLevel, isPrimary, permissions } = updateUserBranchDto;

      // Get existing assignment
      const existingAssignment = await this.prisma.gymUserBranch.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tenantId: true,
            },
          },
          branch: { select: { id: true, name: true, tenantId: true } },
        },
      });

      if (!existingAssignment) {
        throw new NotFoundException('User-branch assignment not found');
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (existingAssignment.branch.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException('Access denied');
        }

        // Only OWNER can modify MANAGER level access
        if (accessLevel === 'MANAGER_ACCESS' && currentUser.role !== 'OWNER') {
          throw new ForbiddenException('Only owners can assign manager access');
        }
      }

      // If this is becoming primary, remove primary from other assignments for this user
      if (isPrimary) {
        await this.prisma.gymUserBranch.updateMany({
          where: {
            userId: existingAssignment.userId,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }

      const updatedAssignment = await this.prisma.gymUserBranch.update({
        where: { id },
        data: {
          ...(accessLevel && { accessLevel }),
          ...(isPrimary !== undefined && { isPrimary }),
          ...(permissions !== undefined && { permissions }),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      this.logger.log(
        `Updated assignment for ${existingAssignment.user.firstName} ${existingAssignment.user.lastName} at branch ${existingAssignment.branch.name}`,
      );

      return updatedAssignment;
    } catch (error) {
      this.logger.error(
        `Failed to update user-branch assignment: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Remove user from branch
   */
  async removeUserFromBranch(id: string, currentUser: any) {
    try {
      // Get existing assignment
      const existingAssignment = await this.prisma.gymUserBranch.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              tenantId: true,
            },
          },
          branch: { select: { id: true, name: true, tenantId: true } },
        },
      });

      if (!existingAssignment) {
        throw new NotFoundException('User-branch assignment not found');
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (existingAssignment.branch.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException('Access denied');
        }

        // MANAGER can only remove STAFF from branches they have access to
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await this.prisma.gymUserBranch.findFirst({
            where: {
              userId: currentUser.id,
              branchId: existingAssignment.branchId,
              accessLevel: 'MANAGER_ACCESS',
            },
          });

          if (
            !hasAccess ||
            existingAssignment.accessLevel === 'MANAGER_ACCESS'
          ) {
            throw new ForbiddenException(
              'You can only remove staff from branches you manage',
            );
          }
        }
      }

      await this.prisma.gymUserBranch.delete({ where: { id } });

      this.logger.log(
        `Removed ${existingAssignment.user.firstName} ${existingAssignment.user.lastName} from branch ${existingAssignment.branch.name}`,
      );

      return { message: 'User removed from branch successfully' };
    } catch (error) {
      this.logger.error(`Failed to remove user from branch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Bulk assign user to multiple branches
   */
  async bulkAssignUserToBranches(
    bulkAssignDto: {
      userId: string;
      branchIds: string[];
      accessLevel?: 'MANAGER_ACCESS' | 'STAFF_ACCESS';
      primaryBranchId?: string;
    },
    currentUser: any,
  ) {
    try {
      const {
        userId,
        branchIds,
        accessLevel = 'STAFF_ACCESS',
        primaryBranchId,
      } = bulkAssignDto;

      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.tenantId) {
        throw new BadRequestException('User must have a tenant');
      }

      const tenantId = user.tenantId;

      // Validate branches exist and are in same tenant
      const branches = await this.prisma.branch.findMany({
        where: {
          id: { in: branchIds },
          tenantId: user.tenantId || undefined,
        },
        select: { id: true, name: true, tenantId: true },
      });

      if (branches.length !== branchIds.length) {
        throw new BadRequestException(
          'Some branches were not found or are not in the same tenant',
        );
      }

      // Role-based access control
      if (currentUser.role !== 'SUPER_ADMIN') {
        if (user.tenantId !== currentUser.tenantId) {
          throw new ForbiddenException('Access denied');
        }

        if (accessLevel === 'MANAGER_ACCESS' && currentUser.role !== 'OWNER') {
          throw new ForbiddenException('Only owners can assign manager access');
        }
      }

      // Remove existing assignments for this user
      await this.prisma.gymUserBranch.deleteMany({
        where: { userId },
      });

      // Create new assignments
      const assignmentsData = branchIds.map((branchId) => ({
        userId,
        branchId,
        tenantId: tenantId,
        accessLevel,
        isPrimary: branchId === primaryBranchId,
      }));

      await this.prisma.gymUserBranch.createMany({
        data: assignmentsData,
      });

      // Get created assignments with relations
      const assignments = await this.prisma.gymUserBranch.findMany({
        where: { userId },
        include: {
          branch: {
            select: { id: true, name: true, address: true },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { branch: { name: 'asc' } }],
      });

      this.logger.log(
        `Bulk assigned ${user.firstName} ${user.lastName} to ${branchIds.length} branches`,
      );

      return {
        message: 'User successfully assigned to branches',
        assignments,
        totalAssignments: assignments.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bulk assign user to branches: ${error.message}`,
      );
      throw error;
    }
  }
}

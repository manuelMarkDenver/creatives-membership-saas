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
      const canCreateResult = await this.subscriptionsService.canCreateBranch(
        createBranchDto.tenantId,
      );

      if (!canCreateResult.canCreate) {
        throw new ForbiddenException(canCreateResult.reason);
      }

      // Create the branch
      const branch = await this.prisma.branch.create({
        data: createBranchDto as any,
      });

      // Auto-create trial subscription if this is a free branch
      if (canCreateResult.freeBranchesRemaining > 0) {
        await this.subscriptionsService.createTrialSubscription(branch.id);
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
      throw new ConflictException('Branch creation failed due to conflict');
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
        where: { tenantId },
        include: {
          _count: {
            select: {
              userBranches: true,
            },
          },
          userBranches: {
            select: {
              user: {
                select: {
                  id: true,
                  role: true,
                  isActive: true,
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
          const members = branch.userBranches.filter(
            (ub) => ub.user.role === 'GYM_MEMBER',
          );
          const activeMembers = members.filter((ub) => ub.user.isActive).length;
          const inactiveMembers = members.filter(
            (ub) => !ub.user.isActive,
          ).length;
          const staff = branch.userBranches.filter((ub) =>
            ['STAFF', 'MANAGER'].includes(ub.user.role),
          ).length;

          return {
            ...branch,
            _count: {
              userBranches: members.length,
              activeMembers,
              inactiveMembers,
              staff,
            },
            userBranches: undefined, // Remove detailed userBranches from response
          };
        });
      });
  }

  async findAllBranchesSystemWide() {
    return this.prisma.branch
      .findMany({
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
              userBranches: true,
            },
          },
          userBranches: {
            select: {
              user: {
                select: {
                  id: true,
                  role: true,
                  isActive: true,
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
          const members = branch.userBranches.filter(
            (ub) => ub.user.role === 'GYM_MEMBER',
          );
          const activeMembers = members.filter((ub) => ub.user.isActive).length;
          const inactiveMembers = members.filter(
            (ub) => !ub.user.isActive,
          ).length;
          const staff = branch.userBranches.filter((ub) =>
            ['STAFF', 'MANAGER'].includes(ub.user.role),
          ).length;

          return {
            ...branch,
            _count: {
              userBranches: members.length,
              activeMembers,
              inactiveMembers,
              staff,
            },
            userBranches: undefined, // Remove detailed userBranches from response
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
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.delete({ where: { id: branchId } });
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

    return this.prisma.userBranch.create({
      data: {
        ...assignUserToBranchDto,
        branchId,
      },
    });
  }

  async updateUserBranchAccess(
    updateUserBranchAccessDto: UpdateUserBranchAccessDto,
    userId: string,
    branchId: string,
  ) {
    const userBranch = await this.prisma.userBranch.findUnique({
      where: {
        userId_branchId: {
          userId,
          branchId,
        },
      },
    });

    if (!userBranch) {
      throw new NotFoundException('User not found in branch');
    }

    return this.prisma.userBranch.update({
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

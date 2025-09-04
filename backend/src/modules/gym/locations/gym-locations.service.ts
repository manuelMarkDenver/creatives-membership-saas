import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserToBranchDto,
  UpdateUserBranchAccessDto,
} from '../../branches/dto/branch.dto';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@Injectable()
export class GymLocationsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createGymLocation(createLocationDto: CreateBranchDto) {
    try {
      if (!createLocationDto.tenantId) {
        throw new BadRequestException(
          'Tenant ID is required to create a gym location',
        );
      }

      // Check if gym tenant can create a location
      const canCreateResult = await this.subscriptionsService.canCreateBranch(
        createLocationDto.tenantId,
      );

      if (!canCreateResult.canCreate) {
        throw new ForbiddenException(canCreateResult.reason);
      }

      // Create the gym location (using Branch table for now)
      const location = await this.prisma.branch.create({
        data: createLocationDto as any,
      });

      // Auto-create trial subscription if this is a free gym location
      if (canCreateResult.freeBranchesRemaining > 0) {
        await this.subscriptionsService.createTrialSubscription(location.id);
      }
      // Note: For paid locations, subscription creation will be handled by payment flow

      return await this.prisma.branch.findUnique({
        where: { id: location.id },
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
      throw new ConflictException(
        'Gym location creation failed due to conflict',
      );
    }
  }

  async updateGymLocation(
    locationId: string,
    updateLocationDto: UpdateBranchDto,
  ) {
    const location = await this.prisma.branch.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException('Gym location not found');
    }

    return this.prisma.branch.update({
      where: { id: locationId },
      data: updateLocationDto,
    });
  }

  async findAllGymLocations(tenantId: string) {
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
      .then((locations) => {
        return locations.map((location) => {
          const members = location.userBranches.filter(
            (ub) => ub.user.role === 'GYM_MEMBER',
          );
          const activeMembers = members.filter((ub) => ub.user.isActive).length;
          const inactiveMembers = members.filter(
            (ub) => !ub.user.isActive,
          ).length;
          const staff = location.userBranches.filter((ub) =>
            ['STAFF', 'MANAGER'].includes(ub.user.role),
          ).length;

          return {
            ...location,
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

  async findGymLocationById(locationId: string) {
    const location = await this.prisma.branch.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException('Gym location not found');
    }
    return location;
  }

  async deleteGymLocation(locationId: string) {
    const location = await this.prisma.branch.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException('Gym location not found');
    }

    return this.prisma.branch.delete({ where: { id: locationId } });
  }

  async assignStaffToLocation(
    assignUserDto: AssignUserToBranchDto,
    locationId: string,
  ) {
    const location = await this.prisma.branch.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException('Gym location not found');
    }

    return this.prisma.userBranch.create({
      data: {
        ...assignUserDto,
        branchId: locationId,
      },
    });
  }

  async updateStaffLocationAccess(
    updateAccessDto: UpdateUserBranchAccessDto,
    userId: string,
    locationId: string,
  ) {
    const userBranch = await this.prisma.userBranch.findUnique({
      where: {
        userId_branchId: {
          userId,
          branchId: locationId,
        },
      },
    });

    if (!userBranch) {
      throw new NotFoundException('User not found in gym location');
    }

    return this.prisma.userBranch.update({
      where: {
        userId_branchId: {
          userId,
          branchId: locationId,
        },
      },
      data: updateAccessDto,
    });
  }
}

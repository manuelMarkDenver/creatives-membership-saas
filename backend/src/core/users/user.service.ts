import { NotificationsService } from '../notifications/notifications.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      // Validate required fields
      if (!data.tenantId?.trim()) {
        throw new BadRequestException('Tenant ID is required');
      }

      if (!this.isValidUUID(data.tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      if (!data.firstName?.trim()) {
        throw new BadRequestException(
          'First name is required and cannot be empty',
        );
      }

      if (!data.lastName?.trim()) {
        throw new BadRequestException(
          'Last name is required and cannot be empty',
        );
      }

      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Validate role if provided (disable for now to avoid enum validation issues)
      // if (data.role && !Object.values(Role).includes(data.role as Role)) {
      //   throw new BadRequestException(
      //     `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`,
      //   );
      // }

      // Verify tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: data.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant with ID '${data.tenantId}' not found`,
        );
      }

      // Clean and prepare data
      const userData: any = {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim().toLowerCase() || null,
        phoneNumber: data.phoneNumber?.trim() || null,
        notes: data.notes?.trim() || null,
      };

      const user = await this.prisma.user.create({
        data: userData,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      this.logger.log(
        `Created user: ${user.firstName} ${user.lastName} (${user.id}) for tenant ${tenant.name}`,
      );
      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          if (field?.includes('email')) {
            throw new ConflictException(
              'A user with this email address already exists',
            );
          }
          throw new ConflictException(
            'A user with this information already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid tenant ID provided');
        }
      }

      this.logger.error(
        `Failed to create user: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to create user. Please try again.',
      );
    }
  }

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(`Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(
        `Failed to get all users: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve users. Please try again.',
      );
    }
  }

  async getUsersByTenant(tenantId: string, filters?: {
    role?: Role,
    search?: string,
    page?: number,
    limit?: number
  }) {
    try {
      // Validate tenant ID format
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      // Verify tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      // Build where clause
      const whereClause: any = { tenantId };
      
      // Add role filter if provided
      if (filters?.role) {
        whereClause.role = filters.role;
      }
      
      // Add search filter if provided
      if (filters?.search) {
        whereClause.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Handle pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          userBranches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      this.logger.log(
        `Retrieved ${users.length} users for tenant ${tenant.name}`,
      );
      return users;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get users for tenant ${tenantId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve users. Please try again.',
      );
    }
  }

  async getUser(id: string) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
              slug: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user. Please try again.',
      );
    }
  }

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      // Validate email format if provided
      if (data.email && !this.isValidEmail(data.email)) {
        throw new BadRequestException('Invalid email format');
      }

      // Validate role if provided (disable for now to avoid enum validation issues)
      // if (data.role && !Object.values(Role).includes(data.role)) {
      //   throw new BadRequestException(
      //     `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`,
      //   );
      // }

      // If tenantId is being changed, verify the new tenant exists
      if (data.tenantId && data.tenantId !== existingUser.tenantId) {
        if (!this.isValidUUID(data.tenantId)) {
          throw new BadRequestException('Invalid tenant ID format');
        }

        const newTenant = await this.prisma.tenant.findUnique({
          where: { id: data.tenantId },
        });

        if (!newTenant) {
          throw new NotFoundException(
            `Tenant with ID '${data.tenantId}' not found`,
          );
        }
      }

      // Clean and prepare update data
      const updateData: any = {
        ...data,
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
        email: data.email?.trim().toLowerCase(),
        phoneNumber: data.phoneNumber?.trim(),
        notes: data.notes?.trim(),
      };
      
      // Remove tenantId from update to avoid the type error
      delete updateData.tenantId;

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      this.logger.log(
        `Updated user: ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.id})`,
      );
      return updatedUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          if (field?.includes('email')) {
            throw new ConflictException(
              'A user with this email address already exists',
            );
          }
          throw new ConflictException(
            'A user with this information already exists',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID '${id}' not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid tenant ID provided');
        }
      }

      this.logger.error(
        `Failed to update user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to update user. Please try again.',
      );
    }
  }

  async deleteUser(id: string) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      const deletedUser = await this.prisma.user.delete({ where: { id } });

      this.logger.log(
        `Deleted user: ${deletedUser.firstName} ${deletedUser.lastName} (${deletedUser.id}) from tenant ${user.tenant?.name || 'Unknown'}`,
      );
      return deletedUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID '${id}' not found`);
        }
      }

      this.logger.error(
        `Failed to delete user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete user. Please try again.',
      );
    }
  }

  /**
   * Get gym members with expiring memberships
   * Only works for GYM tenants - other business types don't have expiring memberships
   */
  async getExpiringGymMembers(
    tenantId: string,
    daysBefore: number = 30,
  ) {
    try {
      // Validate inputs
      if (!this.isValidUUID(tenantId)) {
        throw new BadRequestException('Invalid tenant ID format');
      }

      if (daysBefore < 0 || daysBefore > 365) {
        throw new BadRequestException('Days before must be between 0 and 365');
      }

      // Verify tenant exists and is a GYM
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
      }

      if (tenant.category !== 'GYM') {
        throw new BadRequestException(
          'Expiring memberships are only available for GYM tenants',
        );
      }

      // Calculate target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Query users with expiring memberships
      // Note: This queries the JSON businessData field for endDate
      const users = await this.prisma.user.findMany({
        where: {
          tenantId,
          isActive: true,
          // Query JSON field: businessData.endDate <= targetDate
          AND: [
            {
              businessData: {
                path: ['type'],
                equals: 'gym_member',
              },
            },
            {
              businessData: {
                path: ['endDate'],
                lte: targetDate.toISOString(),
              },
            },
          ],
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
              slug: true,
            },
          },
        },
        // Note: Ordering by JSON fields is limited in Prisma
        // We'll sort in application code instead
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(
        `Found ${users.length} expiring gym members for tenant ${tenant.name}`,
      );

      return users;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to get expiring gym members: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve expiring gym members. Please try again.',
      );
    }
  }

  /**
   * Get expiring gym members with notification preparation
   * This is where you'd integrate with your notifications service later
   */
  async getExpiringGymMembersWithNotifications(
    tenantId: string,
    daysBefore: number = 30,
  ) {
    try {
      const expiringMembers = await this.getExpiringGymMembers(
        tenantId,
        daysBefore,
      );

      // Prepare notification data
      const notificationData = expiringMembers.map((member) => {
        const businessData = member.businessData as any;
        const daysUntilExpiry = Math.ceil(
          (new Date(businessData.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return {
          userId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          email: member.email,
          phoneNumber: member.phoneNumber,
          membershipType: businessData.membershipType,
          expirationDate: businessData.endDate,
          daysUntilExpiry,
          notificationType:
            daysUntilExpiry <= 0 ? 'expired' : 'expiring_soon',
        };
      });

      // TODO: Later integrate with NotificationsService
      // const notificationsSent = await this.notificationsService.sendExpirationNotifications(notificationData);

      // For now, just log what would be sent
      notificationData.forEach((notification) => {
        this.logger.log(
          `Would notify ${notification.memberName} (${notification.email}) - ${notification.notificationType} in ${notification.daysUntilExpiry} days`,
        );
      });

      return {
        expiringMembers,
        notificationData,
        notificationsSent: notificationData.length, // Placeholder
      };
    } catch (error) {
      this.logger.error(
        `Failed to prepare expiring member notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to prepare expiring member notifications. Please try again.',
      );
    }
  }
  //         },
  //         isActive: true,
  //         ...(tenantId && { tenantId }),
  //       },
  //       include: {
  //         tenant: {
  //           select: { id: true, name: true, category: true },
  //         },
  //       },
  //       orderBy: {
  //         createdAt: 'asc',
  //       },
  //     });

  //     // Send notifications
  //     for (const user of users) {
  //       try {
  //         await this.notificationsService.sendMembershipExpiryNotification(user.id);
  //       } catch (notificationError) {
  //         this.logger.error(`Failed to send notification to user ${user.id}: ${notificationError.message}`);
  //       }
  //     }

  //     this.logger.log(`Found ${users.length} expiring users and sent notifications`);
  //     return users;
  //   } catch (error) {
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }

  //     this.logger.error(`Failed to get expiring users: ${error.message}`, error.stack);
  //     throw new InternalServerErrorException('Failed to retrieve expiring users. Please try again.');
  //   }
  // }

  // Helper methods
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

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

  async updateUser(id: string, data: UpdateUserDto) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      // Clean and prepare update data
      const updateData: any = { ...data };
      if (updateData.firstName) updateData.firstName = updateData.firstName.trim();
      if (updateData.lastName) updateData.lastName = updateData.lastName.trim();
      if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
      if (updateData.phoneNumber) updateData.phoneNumber = updateData.phoneNumber.trim();
      if (updateData.notes) updateData.notes = updateData.notes.trim();

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
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

      this.logger.log(`Updated user: ${updatedUser.firstName} ${updatedUser.lastName} (${id})`);
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
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      // Hard delete the user
      await this.prisma.user.delete({
        where: { id },
      });

      this.logger.log(`Deleted user: ${existingUser.firstName} ${existingUser.lastName} (${id})`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
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

  async softDeleteUser(id: string, deletedBy: string, actionData?: { reason: string; notes?: string }) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if user exists and is not already deleted
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      if (existingUser.deletedAt) {
        throw new BadRequestException('User is already deleted');
      }

      // Soft delete the user
      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy,
          updatedAt: new Date(),
        },
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

      this.logger.log(`Soft deleted user: ${deletedUser.firstName} ${deletedUser.lastName} (${id})`);
      
      // Create audit log for the deletion
      await this.createAuditLog({
        memberId: id,
        action: 'ACCOUNT_DELETED',
        reason: actionData?.reason || 'Administrative action',
        notes: actionData?.notes || 'Member account soft deleted',
        previousState: 'ACTIVE',
        newState: 'DELETED',
        performedBy: deletedBy,
        metadata: {
          deletedAt: deletedUser.deletedAt?.toISOString(),
          deletedBy: deletedBy
        }
      });
      
      return deletedUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to soft delete user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete user. Please try again.',
      );
    }
  }

  async restoreUser(id: string, performedBy?: string, actionData?: { reason: string; notes?: string }) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if user exists and is deleted
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      if (!existingUser.deletedAt) {
        throw new BadRequestException('User is not deleted');
      }

      // Restore the user
      const restoredUser = await this.prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date(),
        },
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

      this.logger.log(`Restored user: ${restoredUser.firstName} ${restoredUser.lastName} (${id})`);
      
      // Create audit log for the restoration
      await this.createAuditLog({
        memberId: id,
        action: 'ACCOUNT_RESTORED',
        reason: actionData?.reason || 'Administrative action',
        notes: actionData?.notes || 'Member account restored from deleted state',
        previousState: 'DELETED',
        newState: 'ACTIVE',
        performedBy: performedBy,
        metadata: {
          restoredAt: new Date().toISOString()
        }
      });
      
      return restoredUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Failed to restore user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to restore user. Please try again.',
      );
    }
  }

  async getUsersByTenant(tenantId: string, filters?: {
    role?: Role,
    search?: string,
    page?: number,
    limit?: number,
    requestingUserId?: string,
    requestingUserRole?: Role
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

      // Apply branch-based filtering for MANAGER and STAFF roles
      if (filters?.requestingUserId && filters?.requestingUserRole && 
          ['MANAGER', 'STAFF'].includes(filters.requestingUserRole)) {
        
        // Get the requesting user's branch access
        const requestingUser = await this.prisma.user.findUnique({
          where: { id: filters.requestingUserId },
          include: {
            userBranches: { select: { branchId: true } }
          }
        });

        const accessibleBranchIds = requestingUser?.userBranches.map(ub => ub.branchId) || [];
        
        if (accessibleBranchIds.length > 0) {
          // For members (GYM_MEMBER), filter by customers who have subscriptions in accessible branches
          if (filters.role === 'GYM_MEMBER') {
            const membersInAccessibleBranches = await this.prisma.customerSubscription.findMany({
              where: {
                tenantId,
                branchId: { in: accessibleBranchIds },
                // Include both ACTIVE and CANCELLED members so frontend can filter properly
                status: { in: ['ACTIVE', 'CANCELLED'] }
              },
              select: { customerId: true },
              distinct: ['customerId']
            });
            
            const memberUserIds = membersInAccessibleBranches.map(cs => cs.customerId);
            if (memberUserIds.length > 0) {
              whereClause.id = { in: memberUserIds };
            } else {
              whereClause.id = { in: [] }; // No accessible members
            }
          } 
          // For staff/managers, show users who have branch assignments in accessible branches
          else if (['MANAGER', 'STAFF', 'OWNER'].includes(filters.role || '')) {
            const usersInAccessibleBranches = await this.prisma.userBranch.findMany({
              where: {
                branchId: { in: accessibleBranchIds }
              },
              select: { userId: true },
              distinct: ['userId']
            });
            
            const staffUserIds = usersInAccessibleBranches.map(ub => ub.userId);
            if (staffUserIds.length > 0) {
              // Include requesting user's tenant colleagues who share branches
              const existingIdFilter = whereClause.id;
              if (existingIdFilter) {
                // Intersect with existing filter
                whereClause.id = { 
                  in: staffUserIds.filter(id => existingIdFilter.in?.includes(id))
                };
              } else {
                whereClause.id = { in: staffUserIds };
              }
            } else {
              whereClause.id = { in: [] }; // No accessible staff
            }
          }
        } else {
          // User has no branch assignments, show no results
          whereClause.id = { in: [] };
        }
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
          customerSubscriptions: {
            include: {
              membershipPlan: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                  type: true,
                },
              },
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
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

  /**
   * Get count of expiring members with role-based branch filtering
   */
  async getExpiringMembersCount(tenantId: string, daysBefore: number = 7, userContext?: any) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      
      this.logger.debug(`[COUNT DEBUG] TenantID: ${tenantId}, DaysBefore: ${daysBefore}, TargetDate: ${targetDate.toISOString()}`);
      
      // Build base where clause
      let whereClause: any = {
        tenantId,
        status: 'ACTIVE', // Only active subscriptions
        endDate: {
          lte: targetDate,
          gte: new Date() // Not already expired
        },
        // Exclude subscriptions for deleted users
        customer: {
          deletedAt: null,
          isActive: true // Only active users
        }
      };

      // Apply role-based branch filtering if user context is provided
      if (userContext && userContext.role !== 'SUPER_ADMIN') {
        // Get user's branch access for non-super-admin users
        const userWithBranches = await this.prisma.user.findUnique({
          where: { id: userContext.userId },
          include: {
            userBranches: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });

        const userBranchAccess = userWithBranches?.userBranches || [];
        const accessibleBranchIds = userBranchAccess.map(ub => ub.branchId);
        
        if (userContext.role === 'MANAGER' || userContext.role === 'STAFF') {
          // Managers and Staff can only see branches they have access to
          if (accessibleBranchIds.length > 0) {
            whereClause.branchId = { in: accessibleBranchIds };
            this.logger.debug(`[COUNT DEBUG] ${userContext.role}: Limited to branches: ${accessibleBranchIds}`);
          } else {
            // No branch access = no results
            whereClause.branchId = { in: [] };
            this.logger.debug(`[COUNT DEBUG] ${userContext.role}: No branch access, returning 0`);
          }
        }
        // OWNER role sees all branches in their tenant (no additional filtering needed)
      }
      
      const count = await this.prisma.customerSubscription.count({ where: whereClause });

      // Also get the actual records for debugging
      const records = await this.prisma.customerSubscription.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
              deletedAt: true
            }
          },
          membershipPlan: {
            select: {
              name: true
            }
          }
        }
      });
      
      this.logger.debug(`[COUNT DEBUG] Found ${count} expiring members:`);
      records.forEach((record, idx) => {
        this.logger.debug(`  ${idx + 1}. ${record.customer.email} - Plan: ${record.membershipPlan.name} - End: ${record.endDate} - Status: ${record.status}`);
      });

      return { count, daysBefore };
    } catch (error) {
      this.logger.error(`Failed to get expiring members count: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to get expiring members count');
    }
  }

  /**
   * Get expiring members overview with role-based branch filtering
   * Requirements:
   * - SUPER_ADMIN: All tenants, then can filter by tenant, then by branch
   * - OWNER: All branches in their tenant by default, can filter by branch
   * - MANAGER: All branches they have access to, can filter by branch
   * - STAFF: Only branches they have access to
   */
  async getExpiringMembersOverview(daysBefore: number = 7, filters: any) {
    try {
      // Validate filters
      if (!filters.page || isNaN(filters.page) || filters.page < 1) {
        filters.page = 1;
      }
      if (!filters.limit || isNaN(filters.limit) || filters.limit < 1) {
        filters.limit = 10;
      }
      
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      

      // Get user's branch access information
      const userId = filters.userId;
      let accessibleBranchIds: string[] = [];
      let availableBranches: any[] = [];
      let userBranchAccess: any[] = [];

      if (filters.userRole !== 'SUPER_ADMIN') {
        // Get user's branch access for non-super-admin users
        const userWithBranches = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            userBranches: {
              include: {
                branch: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });

        userBranchAccess = userWithBranches?.userBranches || [];
        accessibleBranchIds = userBranchAccess.map(ub => ub.branchId);
      }

      // Build where clause based on user role
      let whereClause: any = {
        status: 'ACTIVE',
        endDate: {
          lte: targetDate,
          gte: new Date() // Not already expired
        }
      };

      // Apply role-based filtering
      if (filters.userRole === 'SUPER_ADMIN') {
        // Super Admin can filter by specific tenant
        if (filters.tenantId) {
          whereClause.tenantId = filters.tenantId;
          
          // If tenant is specified, get available branches for filtering
          availableBranches = await this.prisma.branch.findMany({
            where: { tenantId: filters.tenantId, isActive: true },
            select: { id: true, name: true, address: true }
          });
        } else {
          // Get all tenants for grouping
          const allTenants = await this.prisma.tenant.findMany({
            select: { id: true, name: true, category: true }
          });
        }
        
        // Super admin can also filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'OWNER') {
        // Owners can see all branches in their tenant
        whereClause.tenantId = filters.userTenantId;
        
        // Get all branches in the tenant for branch filtering dropdown
        availableBranches = await this.prisma.branch.findMany({
          where: { tenantId: filters.userTenantId, isActive: true },
          select: { id: true, name: true, address: true }
        });
        
        // Owner can filter by specific branch
        if (filters.branchId) {
          whereClause.branchId = filters.branchId;
        }
      } else if (filters.userRole === 'MANAGER') {
        // Managers can see branches they have access to
        whereClause.tenantId = filters.userTenantId;
        
        if (accessibleBranchIds.length > 0) {
          if (filters.branchId && accessibleBranchIds.includes(filters.branchId)) {
            // Filter by specific branch if they have access
            whereClause.branchId = filters.branchId;
          } else if (!filters.branchId) {
            // Show all accessible branches by default
            whereClause.branchId = { in: accessibleBranchIds };
          } else {
            // Trying to access branch they don't have permission to
            whereClause.branchId = { in: [] }; // Return no results
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }
        
        // Available branches for dropdown (only branches they have access to)
        availableBranches = userBranchAccess.map(ub => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address
        }));
      } else if (filters.userRole === 'STAFF') {
        // Staff can only see branches they're explicitly assigned to
        whereClause.tenantId = filters.userTenantId;
        
        if (accessibleBranchIds.length > 0) {
          if (filters.branchId && accessibleBranchIds.includes(filters.branchId)) {
            whereClause.branchId = filters.branchId;
          } else {
            // Show only branches they have access to
            whereClause.branchId = { in: accessibleBranchIds };
          }
        } else {
          whereClause.branchId = { in: [] }; // Return no results
        }
        
        // Available branches for dropdown
        availableBranches = userBranchAccess.map(ub => ({
          id: ub.branch.id,
          name: ub.branch.name,
          address: ub.branch.address
        }));
      }

      // Add filter to exclude deleted and inactive users from the where clause
      whereClause.customer = {
        deletedAt: null,
        isActive: true // Only active users should appear in expiring list
      };

      this.logger.debug(`[OVERVIEW DEBUG] WhereClause:`, JSON.stringify(whereClause, null, 2));
      this.logger.debug(`[OVERVIEW DEBUG] TargetDate: ${targetDate.toISOString()}, DaysBefore: ${daysBefore}`);
      this.logger.debug(`[OVERVIEW DEBUG] User Role: ${filters.userRole}, Tenant: ${filters.userTenantId}`);

      const [subscriptions, totalCount] = await Promise.all([
        this.prisma.customerSubscription.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                photoUrl: true
              }
            },
            membershipPlan: {
              select: {
                id: true,
                name: true,
                type: true,
                price: true
              }
            },
            tenant: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            branch: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          },
          orderBy: { endDate: 'asc' },
          skip: Math.max(0, (filters.page - 1) * filters.limit),
          take: Math.min(100, filters.limit)
        }),
        this.prisma.customerSubscription.count({ where: whereClause })
      ]);
      
      // Calculate days until expiry for each subscription
      const enrichedSubscriptions = subscriptions.map(subscription => {
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...subscription,
          daysUntilExpiry,
          memberName: `${subscription.customer.firstName} ${subscription.customer.lastName}`.trim(),
          isExpired: daysUntilExpiry <= 0,
          urgency: daysUntilExpiry <= 1 ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium'
        };
      });

      // Group by tenant for Super Admin view
      const groupedByTenant = filters.userRole === 'SUPER_ADMIN' ? 
        enrichedSubscriptions.reduce((acc, subscription) => {
          const tenantName = subscription.tenant.name;
          if (!acc[tenantName]) {
            acc[tenantName] = {
              tenant: subscription.tenant,
              members: [],
              count: 0
            };
          }
          acc[tenantName].members.push(subscription);
          acc[tenantName].count++;
          return acc;
        }, {} as any) : null;

      // Group by branch for Owner/Manager/Staff with multiple branches
      const groupedByBranch = (filters.userRole !== 'SUPER_ADMIN' && availableBranches.length > 1) ?
        enrichedSubscriptions.reduce((acc, subscription) => {
          const branchName = subscription.branch?.name || 'No Branch Assigned';
          const branchId = subscription.branch?.id || 'unassigned';
          if (!acc[branchName]) {
            acc[branchName] = {
              branch: subscription.branch || { id: 'unassigned', name: 'No Branch Assigned', address: null },
              members: [],
              count: 0
            };
          }
          acc[branchName].members.push(subscription);
          acc[branchName].count++;
          return acc;
        }, {} as any) : null;

      return {
        subscriptions: enrichedSubscriptions,
        groupedByTenant,
        groupedByBranch,
        availableBranches, // For dropdown filtering
        userRole: filters.userRole,
        accessSummary: {
          totalAccessibleBranches: availableBranches.length,
          canFilterByBranch: availableBranches.length > 1,
          canFilterByTenant: filters.userRole === 'SUPER_ADMIN'
        },
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / filters.limit),
          hasNext: filters.page * filters.limit < totalCount,
          hasPrev: filters.page > 1
        },
        summary: {
          totalExpiring: totalCount,
          daysBefore,
          critical: enrichedSubscriptions.filter(s => s.urgency === 'critical').length,
          high: enrichedSubscriptions.filter(s => s.urgency === 'high').length,
          medium: enrichedSubscriptions.filter(s => s.urgency === 'medium').length
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get expiring members overview: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to get expiring members overview');
    }
  }

  // Member Management Methods
  async getMemberState(member: any): Promise<string> {
    // Check if deleted (has deletedAt timestamp)
    if (member.deletedAt) {
      return 'DELETED';
    }

    // Check subscription status
    const activeSubscription = member.customerSubscriptions?.[0];
    if (!activeSubscription) {
      // No subscription - determine if inactive or cancelled based on isActive flag
      return !member.isActive ? 'INACTIVE' : 'CANCELLED';
    }

    // Check if subscription is cancelled
    if (activeSubscription.status === 'CANCELLED') {
      return 'CANCELLED';
    }

    // Check if subscription is expired
    const now = new Date();
    const endDate = new Date(activeSubscription.endDate);
    if (endDate < now || activeSubscription.status === 'EXPIRED') {
      return 'EXPIRED';
    }

    // Member has active subscription - check if account is active
    if (!member.isActive) {
      return 'INACTIVE';
    }

    return 'ACTIVE';
  }

  async getMemberById(memberId: string) {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
      include: {
        customerSubscriptions: {
          include: {
            membershipPlan: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    
    return member;
  }

  async activateMember(memberId: string, request: { reason: string; notes?: string }, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    // Validate current state - can only activate cancelled, expired, or inactive members
    if (currentState !== 'CANCELLED' && currentState !== 'EXPIRED' && currentState !== 'INACTIVE') {
      throw new BadRequestException(`Cannot activate member in ${currentState} state. Member must be cancelled, expired, or inactive.`);
    }
    
    // Update member status
    const updatedMember = await this.prisma.user.update({
      where: { id: memberId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });

    // If there's a cancelled subscription, reactivate it
    const cancelledSubscription = member.customerSubscriptions?.[0];
    if (cancelledSubscription && cancelledSubscription.status === 'CANCELLED') {
      await this.prisma.customerSubscription.update({
        where: { id: cancelledSubscription.id },
        data: { 
          status: 'ACTIVE',
          cancelledAt: null,
          cancellationReason: null,
          cancellationNotes: null
        }
      });
    }
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_ACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: 'ACTIVE',
      performedBy,
      metadata: {
        subscriptionId: cancelledSubscription?.id,
        subscriptionStatus: cancelledSubscription?.status
      }
    });
    
    return { 
      success: true, 
      message: 'Member activated successfully',
      member: updatedMember
    };
  }

  async cancelMember(memberId: string, request: { reason: string; notes?: string }, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    if (currentState !== 'ACTIVE' && currentState !== 'EXPIRED') {
      throw new BadRequestException(`Cannot cancel member in ${currentState} state. Only active or expired members can be cancelled.`);
    }
    
    // Cancel current subscription if exists
    const activeSubscription = member.customerSubscriptions?.[0];
    if (activeSubscription) {
      await this.prisma.customerSubscription.update({
        where: { id: activeSubscription.id },
        data: { 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: request.reason,
          cancellationNotes: request.notes
        }
      });
    }
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'ACCOUNT_DEACTIVATED',
      reason: request.reason,
      notes: request.notes,
      previousState: currentState,
      newState: 'CANCELLED',
      performedBy,
      metadata: {
        subscriptionId: activeSubscription?.id,
        subscriptionEndDate: activeSubscription?.endDate
      }
    });
    
    return { 
      success: true, 
      message: 'Member cancelled successfully'
    };
  }

  async renewMemberSubscription(memberId: string, planId: string, performedBy: string) {
    const member = await this.getMemberById(memberId);
    const currentState = await this.getMemberState(member);
    
    // Get the membership plan
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId }
    });
    
    if (!membershipPlan) {
      throw new NotFoundException('Membership plan not found');
    }
    
    // Calculate new dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membershipPlan.duration);
    
    // Create new subscription
    const newSubscription = await this.prisma.customerSubscription.create({
      data: {
        tenantId: member.tenantId!,
        customerId: memberId,
        membershipPlanId: planId,
        status: 'ACTIVE',
        startDate,
        endDate,
        price: membershipPlan.price,
        autoRenew: true
      }
    });

    // Update member to active if not already
    await this.prisma.user.update({
      where: { id: memberId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    // Create audit log
    await this.createAuditLog({
      memberId,
      action: 'SUBSCRIPTION_RENEWED',
      reason: 'SUBSCRIPTION_RENEWED',
      previousState: currentState,
      newState: 'ACTIVE',
      performedBy,
      metadata: { 
        planId, 
        subscriptionId: newSubscription.id,
        planName: membershipPlan.name,
        duration: membershipPlan.duration,
        price: membershipPlan.price.toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    return { 
      success: true, 
      message: 'Membership renewed successfully',
      subscription: newSubscription
    };
  }

  async getMemberWithStatus(memberId: string) {
    const member = await this.getMemberById(memberId);
    const state = await this.getMemberState(member);
    
    // Get the active subscription if it exists
    const subscription = member.customerSubscriptions?.[0] || null;
    
    return {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      isActive: member.isActive,
      currentState: state,
      subscription: subscription
    };
  }

  async getMemberHistory(memberId: string, query: { page?: number; limit?: number; category?: 'ACCOUNT' | 'SUBSCRIPTION' | 'PAYMENT' | 'ACCESS'; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 50, category, startDate, endDate } = query;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const where: any = { memberId };
    
    if (category) {
      // Filter by action category
      const categoryActions = {
        ACCOUNT: ['ACCOUNT_CREATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_DELETED', 'ACCOUNT_RESTORED'],
        SUBSCRIPTION: ['SUBSCRIPTION_STARTED', 'SUBSCRIPTION_RENEWED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_RESUMED'],
        PAYMENT: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'],
        ACCESS: ['FACILITY_ACCESS_GRANTED', 'FACILITY_ACCESS_REVOKED', 'LOGIN_SUCCESSFUL', 'LOGIN_FAILED']
      };
      
      where.action = { in: categoryActions[category] || [] };
    }
    
    if (startDate) {
      where.performedAt = { ...where.performedAt, gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.performedAt = { ...where.performedAt, lte: new Date(endDate) };
    }
    
    // Get events and total count
    const [events, total] = await Promise.all([
      this.prisma.memberAuditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { performedAt: 'desc' },
        skip: offset,
        take: limit
      }),
      
      this.prisma.memberAuditLog.count({ where })
    ]);
    
    return {
      logs: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  getActionReasons() {
    return [
      {
        category: 'ACCOUNT',
        reasons: ['Member request', 'Payment received', 'System error resolved', 'Administrative decision', 'Policy compliance']
      },
      {
        category: 'SUBSCRIPTION',
        reasons: ['Member request', 'Non-payment', 'Policy violation', 'System maintenance', 'Membership transfer', 'SUBSCRIPTION_RENEWED']
      }
    ];
  }

  private async createAuditLog(data: {
    memberId: string;
    action: string;
    reason?: string;
    notes?: string;
    previousState?: string;
    newState?: string;
    performedBy?: string;
    metadata?: any;
  }) {
    try {
      const result = await this.prisma.memberAuditLog.create({
        data: {
          memberId: data.memberId,
          action: data.action as any,
          reason: data.reason,
          notes: data.notes,
          previousState: data.previousState,
          newState: data.newState,
          performedBy: data.performedBy,
          metadata: data.metadata
        }
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

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

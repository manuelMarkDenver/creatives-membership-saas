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
                status: 'ACTIVE'
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

  /**
   * Get count of expiring members for a tenant
   */
  async getExpiringMembersCount(tenantId: string, daysBefore: number = 7) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Count expiring members using customerSubscriptions
      const count = await this.prisma.customerSubscription.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          endDate: {
            lte: targetDate,
            gte: new Date() // Not already expired
          }
        }
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

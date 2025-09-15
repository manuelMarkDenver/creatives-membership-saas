import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
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
    private supabaseService: SupabaseService,
  ) {}

  async createUser(data: CreateUserDto) {
    try {
      // Validate required fields
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

      // Validate globalRole if provided
      if (data.globalRole && !Object.values(Role).includes(data.globalRole)) {
        throw new BadRequestException(
          `Invalid global role. Must be one of: ${Object.values(Role).join(', ')}`,
        );
      }

      // Clean and prepare data
      const userData: any = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim().toLowerCase() || null,
        phoneNumber: data.phoneNumber?.trim() || null,
        notes: data.notes?.trim() || null,
        globalRole: data.globalRole || null,
        photoUrl: data.photoUrl || null,
        businessData: data.businessData || null,
      };

      const user = await this.prisma.user.create({
        data: userData,
      });

      this.logger.log(
        `Created user: ${user.firstName} ${user.lastName} (${user.id})`,
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
          throw new BadRequestException('Invalid data provided');
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
      if (updateData.firstName)
        updateData.firstName = updateData.firstName.trim();
      if (updateData.lastName) updateData.lastName = updateData.lastName.trim();
      if (updateData.email)
        updateData.email = updateData.email.trim().toLowerCase();
      if (updateData.phoneNumber)
        updateData.phoneNumber = updateData.phoneNumber.trim();
      if (updateData.notes) updateData.notes = updateData.notes.trim();

      // Separate gym member profile fields
      const gymProfileFields = [
        'emergencyContactName',
        'emergencyContactPhone',
        'emergencyContactRelation',
        'medicalConditions',
        'fitnessGoals',
        'preferredTrainer',
        'trainerContactNumber',
        'gender',
        'height',
        'weight',
        'allergies',
        'lastVisit',
        'dateOfBirth',
        'totalVisits',
        'fitnessLevel',
        'notifications',
        'favoriteEquipment',
        'averageVisitsPerWeek',
        'preferredWorkoutTime',
        'membershipHistory',
        'profileMetadata',
      ];

      const userUpdateData: any = {};
      const gymProfileUpdateData: any = {};

      Object.keys(updateData).forEach((key) => {
        if (gymProfileFields.includes(key)) {
          gymProfileUpdateData[key] = updateData[key];
        } else {
          userUpdateData[key] = updateData[key];
        }
      });

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...userUpdateData,
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
          gymMemberProfile: true,
        },
      });

      // Update or create gym member profile if profile fields are provided
      if (Object.keys(gymProfileUpdateData).length > 0) {
        const existingProfile = await this.prisma.gymMemberProfile.findUnique({
          where: { userId: id },
        });

        if (existingProfile) {
          await this.prisma.gymMemberProfile.update({
            where: { userId: id },
            data: {
              ...gymProfileUpdateData,
              updatedAt: new Date(),
            },
          });
        } else {
          await this.prisma.gymMemberProfile.create({
            data: {
              userId: id,
              ...gymProfileUpdateData,
            },
          });
        }
      }

      this.logger.log(
        `Updated user: ${updatedUser.firstName} ${updatedUser.lastName} (${id})`,
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

      this.logger.log(
        `Deleted user: ${existingUser.firstName} ${existingUser.lastName} (${id})`,
      );
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

  async softDeleteUser(
    id: string,
    deletedBy: string,
    actionData?: { reason: string; notes?: string },
  ) {
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

      this.logger.log(
        `Soft deleted user: ${deletedUser.firstName} ${deletedUser.lastName} (${id})`,
      );

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
          deletedBy: deletedBy,
        },
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

  async restoreUser(
    id: string,
    performedBy?: string,
    actionData?: { reason: string; notes?: string },
  ) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Get user with subscription information to determine restore type
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          gymMemberSubscriptions: {
            include: {
              membershipPlan: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          tenant: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID '${id}' not found`);
      }

      // Determine what type of restoration is needed
      const isDeleted = !!existingUser.deletedAt;
      const latestSubscription = existingUser.gymMemberSubscriptions?.[0];
      const isCancelled = latestSubscription?.status === 'CANCELLED';

      // Check if user needs restoration
      if (!isDeleted && !isCancelled) {
        // Check if user is simply inactive
        if (!existingUser.isActive) {
          // User is just inactive - activate them
          const restoredUser = await this.prisma.user.update({
            where: { id },
            data: {
              isActive: true,
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

          await this.createAuditLog({
            memberId: id,
            action: 'ACCOUNT_ACTIVATED',
            reason: actionData?.reason || 'Account reactivation',
            notes:
              actionData?.notes ||
              'Member account activated from inactive state',
            previousState: 'INACTIVE',
            newState: 'ACTIVE',
            performedBy: performedBy,
            metadata: { restoredAt: new Date().toISOString() },
          });

          this.logger.log(
            `Activated inactive user: ${restoredUser.firstName} ${restoredUser.lastName} (${id})`,
          );
          return restoredUser;
        }

        throw new BadRequestException(
          'User does not require restoration - already active and not deleted or cancelled',
        );
      }

      // Handle soft-deleted users (priority: deletion trumps cancellation)
      if (isDeleted) {
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

        await this.createAuditLog({
          memberId: id,
          action: 'ACCOUNT_RESTORED',
          reason: actionData?.reason || 'Account restoration',
          notes:
            actionData?.notes || 'Member account restored from deleted state',
          previousState: 'DELETED',
          newState: 'ACTIVE',
          performedBy: performedBy,
          metadata: { restoredAt: new Date().toISOString() },
        });

        this.logger.log(
          `Restored deleted user: ${restoredUser.firstName} ${restoredUser.lastName} (${id})`,
        );
        return restoredUser;
      }

      // Handle cancelled subscriptions
      if (isCancelled) {
        // Activate the user account
        const restoredUser = await this.prisma.user.update({
          where: { id },
          data: {
            isActive: true,
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

        // Reactivate the cancelled subscription
        if (latestSubscription) {
          await this.prisma.gymMemberSubscription.update({
            where: { id: latestSubscription.id },
            data: {
              status: 'ACTIVE',
              cancelledAt: null,
              cancellationReason: null,
              cancellationNotes: null,
              updatedAt: new Date(),
            },
          });
        }

        await this.createAuditLog({
          memberId: id,
          action: 'SUBSCRIPTION_RESTORED',
          reason: actionData?.reason || 'Subscription restoration',
          notes:
            actionData?.notes ||
            'Member subscription restored from cancelled state',
          previousState: 'CANCELLED',
          newState: 'ACTIVE',
          performedBy: performedBy,
          metadata: {
            restoredAt: new Date().toISOString(),
            subscriptionId: latestSubscription?.id,
            subscriptionPlan: latestSubscription?.membershipPlan?.name,
          },
        });

        this.logger.log(
          `Restored cancelled user: ${restoredUser.firstName} ${restoredUser.lastName} (${id})`,
        );
        return restoredUser;
      }

      // Should never reach here, but just in case
      throw new BadRequestException('Unable to determine restoration type');
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

  async getUsersByTenant(
    tenantId: string,
    filters?: {
      role?: Role;
      search?: string;
      page?: number;
      limit?: number;
      requestingUserId?: string;
      requestingUserRole?: Role;
    },
  ) {
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
        // Handle CLIENT role filtering - CLIENT is a global role, not business role
        if (filters.role === 'CLIENT') {
          whereClause.globalRole = 'CLIENT';
        } else {
          whereClause.role = filters.role;
        }
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
      if (
        filters?.requestingUserId &&
        filters?.requestingUserRole &&
        ['MANAGER', 'STAFF'].includes(filters.requestingUserRole)
      ) {
        // Get the requesting user's branch access
        const requestingUser = await this.prisma.user.findUnique({
          where: { id: filters.requestingUserId },
          include: {
            gymUserBranches: { select: { branchId: true } },
          },
        });

        const accessibleBranchIds =
          requestingUser?.gymUserBranches.map((ub) => ub.branchId) || [];

        if (accessibleBranchIds.length > 0) {
          // For members (CLIENT), filter by customers who have subscriptions in accessible branches
          if (filters.role === 'CLIENT' || whereClause.globalRole === 'CLIENT') {
            const membersInAccessibleBranches =
              await this.prisma.gymMemberSubscription.findMany({
                where: {
                  tenantId,
                  branchId: { in: accessibleBranchIds },
                  // Include both ACTIVE and CANCELLED members so frontend can filter properly
                  status: { in: ['ACTIVE', 'CANCELLED'] },
                },
                select: { memberId: true },
                distinct: ['memberId'],
              });

            const memberUserIds = membersInAccessibleBranches.map(
              (cs) => cs.memberId,
            );
            if (memberUserIds.length > 0) {
              whereClause.id = { in: memberUserIds };
            } else {
              whereClause.id = { in: [] }; // No accessible members
            }
          }
          // For staff/managers, show users who have branch assignments in accessible branches
          else if (['MANAGER', 'STAFF'].includes(filters.role || '')) {
            const usersInAccessibleBranches =
              await this.prisma.gymUserBranch.findMany({
                where: {
                  branchId: { in: accessibleBranchIds },
                },
                select: { userId: true },
                distinct: ['userId'],
              });

            const staffUserIds = usersInAccessibleBranches.map(
              (ub) => ub.userId,
            );
            if (staffUserIds.length > 0) {
              // Include requesting user's tenant colleagues who share branches
              const existingIdFilter = whereClause.id;
              if (existingIdFilter) {
                // Intersect with existing filter
                whereClause.id = {
                  in: staffUserIds.filter((id) =>
                    existingIdFilter.in?.includes(id),
                  ),
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
          gymUserBranches: {
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
          gymMemberProfile: true,
          gymMemberSubscriptions: {
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

      // Transform gymMemberSubscriptions to gymSubscriptions for frontend compatibility
      const transformedUsers = users.map(user => ({
        ...user,
        gymSubscriptions: user.gymMemberSubscriptions,
        gymMemberSubscriptions: undefined, // Remove the original field
      }));

      this.logger.log(
        `Retrieved ${users.length} users for tenant ${tenant.name}`,
      );
      return transformedUsers;
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
          gymMemberProfile: true,
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









  // Photo Upload Methods (Business Agnostic - works for all user types)
  async uploadUserPhoto(userId: string, file: Express.Multer.File) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!file) {
        throw new BadRequestException('No file provided');
      }

      this.logger.log(`Processing photo upload for user ${userId}`, {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });

      // Upload to Supabase Storage
      const uploadResult = await this.supabaseService.uploadMemberPhoto(
        userId,
        user.tenantId!, // Use user's tenantId for organizing files
        file,
      );

      // Update user record with new photo URL
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          photoUrl: uploadResult.url,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photoUrl: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `Successfully uploaded photo for user ${userId} to ${uploadResult.url}`,
      );

      return {
        success: true,
        message: 'Photo uploaded successfully',
        photoUrl: uploadResult.url,
        user: updatedUser,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to upload photo for user ${userId}:`, error);
      throw new InternalServerErrorException(
        `Failed to upload user photo: ${error.message}`,
      );
    }
  }

  async deleteUserPhoto(userId: string) {
    try {
      // Validate user ID format
      if (!this.isValidUUID(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.photoUrl) {
        return {
          success: true,
          message: 'No photo to delete',
        };
      }

      // Delete from Supabase Storage
      try {
        // Extract the path from the photoUrl or construct it
        const photoPath = this.supabaseService.extractPhotoPath(user.photoUrl);
        if (photoPath) {
          await this.supabaseService.deleteMemberPhoto(photoPath);
        } else {
          // If we can't extract the path, try the standard path format
          const standardPath = `${user.tenantId}/${userId}/profile.jpg`;
          await this.supabaseService.deleteMemberPhoto(standardPath);
        }
      } catch (storageError) {
        this.logger.warn(
          `Failed to delete photo from storage for user ${userId}:`,
          storageError,
        );
        // Continue with database update even if storage deletion fails
      }

      // Remove photo URL from user record
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          photoUrl: null,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Deleted photo for user ${userId}`);

      return {
        success: true,
        message: 'Photo deleted successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete photo for user ${userId}:`, error);
      throw new Error(`Failed to delete user photo: ${error.message}`);
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

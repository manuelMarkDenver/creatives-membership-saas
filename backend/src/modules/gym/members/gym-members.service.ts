import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { S3UploadService } from '../../../core/supabase/s3-upload.service';

@Injectable()
export class GymMembersService {
  private readonly logger = new Logger(GymMembersService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private s3UploadService: S3UploadService,
  ) {}

  // ========================================
  // Gym Member Creation - Creates User + GymMemberProfile automatically
  // ========================================

  async createGymMember(data: any, tenantId: string) {
    try {
      // Validate required fields
      if (!data.firstName?.trim()) {
        throw new BadRequestException('First name is required');
      }
      if (!data.lastName?.trim()) {
        throw new BadRequestException('Last name is required');
      }

      // Create user and gym member profile in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create the user
        const user = await tx.user.create({
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email?.trim().toLowerCase() || null,
            phoneNumber: data.phoneNumber?.trim() || null,
          },
        });

        // 2. Create the gym member profile
        const gymProfile = await tx.gymMemberProfile.create({
          data: {
            userId: user.id,
            tenantId: tenantId,
            role: 'GYM_MEMBER',
            status: 'ACTIVE',
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            joinedDate: new Date(),
          },
          include: {
            user: true,
            tenant: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        });

        return gymProfile;
      });

      this.logger.log(
        `Created gym member: ${result.user.firstName} ${result.user.lastName} (${result.userId})`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create gym member: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  // ========================================
  // NOTE: For basic user CRUD (read, update, delete, photo upload)
  // use the Users controller at /users - it handles ALL user types (GYM_MEMBER, ECOM_CUSTOMER, etc.)
  //
  // This service focuses ONLY on gym-specific business logic:
  // - Subscription management
  // - Gym analytics and stats
  // - Workout tracking
  // - Equipment usage
  - Gym-specific reporting
  // ========================================

  async getGymSpecificStats(tenantId: string) {
    // TODO: Implement gym-specific member statistics (attendance, equipment usage, etc.)
    return { message: 'Gym-specific stats will be implemented here' };
  }

  async getWorkoutStats(tenantId: string, memberId?: string) {
    // TODO: Implement workout tracking and statistics
    return { message: 'Workout stats will be implemented here' };
  }

  async getEquipmentUsage(tenantId: string) {
    // TODO: Implement equipment usage analytics
    return { message: 'Equipment usage analytics will be implemented here' };
  }
}

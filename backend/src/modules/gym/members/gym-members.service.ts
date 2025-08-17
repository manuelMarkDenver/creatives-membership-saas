import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { S3UploadService } from '../../../core/supabase/s3-upload.service';

@Injectable()
export class GymMembersService {
  private readonly logger = new Logger(GymMembersService.name);

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private s3UploadService: S3UploadService
  ) {}

  // ========================================
  // NOTE: For basic user CRUD (create, read, update, delete)
  // use the Users service - it handles ALL user types (GYM_MEMBER, ECOM_CUSTOMER, etc.)
  // 
  // This service focuses ONLY on gym-specific business logic:
  // - Subscription management
  // - Gym analytics and stats
  // - Workout tracking
  // - Equipment usage
  // - Gym-specific reporting
  // ========================================

  // Placeholder methods - will be implemented as part of the overhaul
  async getAllMembers(tenantId: string, options: any) {
    // TODO: Implement comprehensive gym member listing with filtering
    return { message: 'Gym members endpoint - under construction' };
  }

  async getMemberStats(tenantId: string) {
    // TODO: Implement gym-specific member statistics
    return { message: 'Gym member stats - under construction' };
  }

  async getExpiringMembers(tenantId: string, daysAhead: number) {
    // TODO: Implement expiring gym member subscriptions
    return { message: 'Expiring gym members - under construction' };
  }

  async getExpiredMembers(tenantId: string) {
    // TODO: Implement expired gym member subscriptions
    return { message: 'Expired gym members - under construction' };
  }

  async getMemberById(memberId: string, tenantId: string) {
    // TODO: Implement individual gym member retrieval
    return { message: 'Gym member details - under construction' };
  }

  async createMember(createMemberDto: any, tenantId: string, createdBy: string) {
    // TODO: Implement gym member creation
    return { message: 'Create gym member - under construction' };
  }

  async updateMember(memberId: string, updateMemberDto: any, tenantId: string) {
    // TODO: Implement gym member updates
    return { message: 'Update gym member - under construction' };
  }

  async deleteMember(memberId: string, tenantId: string) {
    // TODO: Implement gym member deletion
    return { message: 'Delete gym member - under construction' };
  }

  async toggleMemberStatus(memberId: string, tenantId: string, isActive: boolean) {
    // TODO: Implement gym member activation/deactivation
    return { message: 'Toggle gym member status - under construction' };
  }

  // Photo Upload Methods
  
  async uploadMemberPhoto(memberId: string, tenantId: string, file: Express.Multer.File) {
    try {
      // Verify member exists and belongs to tenant
      const member = await this.prisma.user.findFirst({
        where: {
          id: memberId,
          tenantId: tenantId,
          role: 'GYM_MEMBER'
        }
      });

      if (!member) {
        throw new NotFoundException('Gym member not found');
      }

      // Clean up existing photos BEFORE uploading new one
      this.logger.log(`Starting cleanup for member ${memberId}`);
      
      // Delete the current photo if it exists
      if (member.photoUrl) {
        const oldPhotoPath = this.supabaseService.extractPhotoPath(member.photoUrl);
        if (oldPhotoPath) {
          this.logger.log(`Deleting current photo: ${oldPhotoPath}`);
          await Promise.allSettled([
            this.supabaseService.deleteMemberPhoto(oldPhotoPath),
            this.s3UploadService.deleteMemberPhoto(oldPhotoPath)
          ]);
        }
      }
      
      // Also delete common profile image variants to prevent duplicates
      const commonExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      this.logger.log(`Cleaning up profile variants for member ${memberId}`);
      
      for (const ext of commonExtensions) {
        const profilePath = `${tenantId}/${memberId}/profile.${ext}`;
        await Promise.allSettled([
          this.supabaseService.deleteMemberPhoto(profilePath),
          this.s3UploadService.deleteMemberPhoto(profilePath)
        ]);
      }
      
      this.logger.log(`Cleanup completed for member ${memberId}`);
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      let uploadResult: { url: string; path: string };
      let uploadMethod = 'unknown';

      // Try Supabase first, then fallback to S3
      try {
        this.logger.log(`Attempting Supabase upload for member ${memberId}`);
        uploadResult = await this.supabaseService.uploadMemberPhoto(
          memberId,
          tenantId,
          file
        );
        uploadMethod = 'Supabase';
        this.logger.log(`✅ Supabase upload successful for member ${memberId}`);
      } catch (supabaseError) {
        this.logger.warn(`⚠️  Supabase upload failed for member ${memberId}: ${supabaseError.message}`);
        
        try {
          this.logger.log(`Attempting S3 upload fallback for member ${memberId}`);
          uploadResult = await this.s3UploadService.uploadMemberPhoto(
            memberId,
            tenantId,
            file
          );
          uploadMethod = 'S3 Direct';
          this.logger.log(`✅ S3 fallback upload successful for member ${memberId}`);
        } catch (s3Error) {
          this.logger.error(`❌ Both upload methods failed for member ${memberId}`);
          this.logger.error(`Supabase error: ${supabaseError.message}`);
          this.logger.error(`S3 error: ${s3Error.message}`);
          throw new Error(`Failed to upload photo: Both Supabase (${supabaseError.message}) and S3 (${s3Error.message}) failed`);
        }
      }

      // Update member record with new photo URL
      const updatedMember = await this.prisma.user.update({
        where: { id: memberId },
        data: {
          photoUrl: uploadResult.url,
          updatedAt: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true
        }
      });

      return {
        success: true,
        message: `Photo uploaded successfully via ${uploadMethod}`,
        member: updatedMember,
        photo: {
          url: uploadResult.url,
          path: uploadResult.path
        },
        uploadMethod
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Upload error for member ${memberId}:`, error);
      throw new Error(`Failed to upload member photo: ${error.message}`);
    }
  }

  async deleteMemberPhoto(memberId: string, tenantId: string) {
    try {
      // Verify member exists and belongs to tenant
      const member = await this.prisma.user.findFirst({
        where: {
          id: memberId,
          tenantId: tenantId,
          role: 'GYM_MEMBER'
        }
      });

      if (!member) {
        throw new NotFoundException('Gym member not found');
      }

      if (!member.photoUrl) {
        return {
          success: true,
          message: 'No photo to delete'
        };
      }

      // Extract photo path and delete from storage
      const photoPath = this.supabaseService.extractPhotoPath(member.photoUrl);
      if (photoPath) {
        await this.supabaseService.deleteMemberPhoto(photoPath);
      }

      // Remove photo URL from member record
      const updatedMember = await this.prisma.user.update({
        where: { id: memberId },
        data: {
          photoUrl: null,
          updatedAt: new Date()
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true
        }
      });

      return {
        success: true,
        message: 'Photo deleted successfully',
        member: updatedMember
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete member photo: ${error.message}`);
    }
  }
}

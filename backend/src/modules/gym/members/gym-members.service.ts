import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';

@Injectable()
export class GymMembersService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService
  ) {}

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

      // Delete old photo if exists
      if (member.photoUrl) {
        const oldPhotoPath = this.supabaseService.extractPhotoPath(member.photoUrl);
        if (oldPhotoPath) {
          await this.supabaseService.deleteMemberPhoto(oldPhotoPath);
        }
      }

      // Upload new photo
      const uploadResult = await this.supabaseService.uploadMemberPhoto(
        memberId,
        tenantId,
        file
      );

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
        message: 'Photo uploaded successfully',
        member: updatedMember,
        photo: {
          url: uploadResult.url,
          path: uploadResult.path
        }
      };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
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

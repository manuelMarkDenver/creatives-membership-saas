import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GymMembersService } from './gym-members.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../../../types/express';
import '../../../types/express';

interface CreateGymMemberDto {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: any;
  emergencyContact?: any;
  membershipPlanId?: string;
  paymentMethod?: string;
}

interface UpdateGymMemberDto {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: any;
  emergencyContact?: any;
  isActive?: boolean;
}

@Controller('gym/members')
@UseGuards(AuthGuard, RBACGuard)
export class GymMembersController {
  constructor(private readonly gymMembersService: GymMembersService) {}

  @Get()
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getAllMembers(@Req() req: RequestWithUser, @Query() query: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const { page, limit, search, status, membershipPlan } = query;
    return this.gymMembersService.getAllMembers(tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      status,
      membershipPlan,
    });
  }

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberStats(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getMemberStats(tenantId);
  }

  @Get('expiring')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiringMembers(@Req() req: RequestWithUser, @Query('days') days?: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const daysAhead = days ? parseInt(days) : 7;
    return this.gymMembersService.getExpiringMembers(tenantId, daysAhead);
  }

  @Get('expired')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiredMembers(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getExpiredMembers(tenantId);
  }

  @Get(':memberId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberById(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getMemberById(memberId, tenantId);
  }

  @Post()
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async createMember(@Body() createMemberDto: CreateGymMemberDto, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    const createdBy = req.user?.id;
    
    if (!tenantId || !createdBy) {
      throw new Error('Tenant ID and User ID are required');
    }
    
    return this.gymMembersService.createMember(createMemberDto, tenantId, createdBy);
  }

  @Put(':memberId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async updateMember(
    @Param('memberId') memberId: string,
    @Body() updateMemberDto: UpdateGymMemberDto,
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.updateMember(memberId, updateMemberDto, tenantId);
  }

  @Delete(':memberId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async deleteMember(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.deleteMember(memberId, tenantId);
  }

  @Put(':memberId/activate')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async activateMember(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.toggleMemberStatus(memberId, tenantId, true);
  }

  @Put(':memberId/deactivate')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async deactivateMember(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.toggleMemberStatus(memberId, tenantId, false);
  }

  @Post(':memberId/photo')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  @UseInterceptors(FileInterceptor('photo', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1
    },
    fileFilter: (req, file, callback) => {
      // Check if file is an image
      if (!file.mimetype.startsWith('image/')) {
        return callback(new Error('Only image files are allowed'), false);
      }
      callback(null, true);
    }
  }))
  async uploadMemberPhoto(
    @Param('memberId') memberId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!file) {
      throw new Error('Photo file is required');
    }

    return this.gymMembersService.uploadMemberPhoto(memberId, tenantId, file);
  }

  @Delete(':memberId/photo')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async deleteMemberPhoto(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    return this.gymMembersService.deleteMemberPhoto(memberId, tenantId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GymMembersService } from './gym-members.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: Role;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  headers: Request['headers'];
}

interface CreateGymMemberDto {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
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
  emergencyContactName?: any;
  emergencyContactPhone?: any;
  emergencyContactRelation?: any;
  isActive?: boolean;
}

@Controller('gym/members')
@UseGuards(AuthGuard, RBACGuard)
export class GymMembersController {
  constructor(private readonly gymMembersService: GymMembersService) {}

  // ========================================
  // Gym Member Creation - Creates User + GymMemberProfile automatically
  // ========================================

  @Post()
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async createGymMember(
    @Body() data: CreateGymMemberDto,
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.gymMembersService.createGymMember(data, tenantId);
  }

  // ========================================
  // NOTE: For basic user CRUD (read, update, delete, photo upload)
  // use the Users controller at /users - it handles ALL user types
  //
  // This controller focuses ONLY on gym-specific business logic
  // ========================================

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getGymStats(@Req() req: RequestWithUser) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getGymSpecificStats(tenantId);
  }

  @Get('workout-stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getWorkoutStats(
    @Req() req: RequestWithUser,
    @Query('memberId') memberId?: string,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getWorkoutStats(tenantId, memberId);
  }

  @Get('equipment-usage')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getEquipmentUsage(@Req() req: RequestWithUser) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.gymMembersService.getEquipmentUsage(tenantId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
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

  // ========================================
  // Member Management Actions - Gym Specific
  // ========================================

  @Post(':id/activate')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async activateMember(
    @Param('id') id: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    const { reason, notes } = body || {};
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Reason is required and cannot be empty');
    }

    return await this.gymMembersService.activateMember(
      id,
      { reason: reason.trim(), notes },
      performedBy,
    );
  }

  @Post(':id/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async cancelMember(
    @Param('id') id: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: RequestWithUser,
  ) {
    const { reason, notes } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!reason) {
      throw new Error('Reason is required');
    }

    return this.gymMembersService.cancelMember(id, { reason, notes }, performedBy);
  }

  @Post(':id/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async renewMemberSubscription(
    @Param('id') id: string,
    @Body() body: { membershipPlanId: string },
    @Req() req: RequestWithUser,
  ) {
    const { membershipPlanId } = body;
    const performedBy = req.user?.id;

    if (!performedBy) {
      throw new Error('User not authenticated');
    }

    if (!membershipPlanId) {
      throw new Error('Membership plan ID is required');
    }

    return this.gymMembersService.renewMemberSubscription(
      id,
      membershipPlanId,
      performedBy,
    );
  }

  @Get(':id/status')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberWithStatus(@Param('id') id: string) {
    return this.gymMembersService.getMemberWithStatus(id);
  }

  @Get(':id/history')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getMemberHistory(
    @Param('id') id: string,
    @Query()
    query: {
      page?: string;
      limit?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    // Convert string numbers to integers
    const parsedQuery = {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      category: query.category as
        | 'ACCOUNT'
        | 'SUBSCRIPTION'
        | 'PAYMENT'
        | 'ACCESS'
        | undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    return this.gymMembersService.getMemberHistory(id, parsedQuery);
  }

  // Get action reasons - MUST be before parameterized routes
  @Get('action-reasons')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getActionReasons() {
    return this.gymMembersService.getActionReasons();
  }

  // Gym-specific routes for expiring memberships - MUST be before parameterized routes
  @Get('expiring/:tenantId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiringMembers(
    @Param('tenantId') tenantId: string,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '7', 10);
    return this.gymMembersService.getExpiringGymMembers(tenantId, days);
  }

  // Notifications for expiring memberships
  @Get('expiring/:tenantId/notifications')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiringMembersWithNotifications(
    @Param('tenantId') tenantId: string,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '7', 10);
    return this.gymMembersService.getExpiringGymMembersWithNotifications(
      tenantId,
      days,
    );
  }

  // Get count of expiring memberships for badges/notifications
  @Get('expiring-count/:tenantId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiringMembersCount(
    @Param('tenantId') tenantId: string,
    @Req() req: RequestWithUser,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const days = parseInt(daysBefore || '7', 10);

    // Pass user context for role-based filtering
    const userContext = {
      userId: req.user?.id,
      role: req.user?.role,
      tenantId: req.user?.tenantId,
    };

    return this.gymMembersService.getExpiringMembersCount(
      tenantId,
      days,
      userContext,
    );
  }

  // Super Admin + role-based expiring members overview
  @Get('expiring-overview')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.STAFF)
  async getExpiringMembersOverview(
    @Req() req: RequestWithUser,
    @Query('daysBefore') daysBefore?: string,
    @Query('tenantId') tenantId?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const days = parseInt(daysBefore || '7', 10);
    const filters = {
      userId: req.user?.id, // Pass user ID for branch access validation
      tenantId,
      branchId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      userRole: req.user?.role,
      userTenantId: req.user?.tenantId,
    };

    return await this.gymMembersService.getExpiringMembersOverview(days, filters);
  }
}

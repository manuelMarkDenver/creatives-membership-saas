import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GymSubscriptionsService } from './gym-subscriptions.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ChangePlanDto } from './dto/change-plan.dto';

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

@Controller('gym/subscriptions')
@UseGuards(AuthGuard, RBACGuard)
export class GymSubscriptionsController {
  constructor(
    private readonly gymSubscriptionsService: GymSubscriptionsService,
  ) {}

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionStats(@Req() req: RequestWithUser) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    // For Super Admin or users without tenantId, return empty stats
    if (!tenantId) {
      return { total: 0, active: 0, expired: 0, cancelled: 0, expiring: 0 };
    }
    return this.gymSubscriptionsService.getSubscriptionStats(tenantId);
  }

  @Get('expiring')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getExpiringSubscriptions(
    @Req() req: RequestWithUser,
    @Query('daysBefore') daysBefore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      return {
        subscriptions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
        summary: { totalExpiring: 0, critical: 0, high: 0, medium: 0 },
      };
    }
    const days = parseInt(daysBefore || '7', 10);
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);
    return this.gymSubscriptionsService.getExpiringSubscriptions(
      tenantId,
      days,
      pageNum,
      limitNum,
    );
  }

  @Get('expiring/count')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getExpiringCount(
    @Req() req: RequestWithUser,
    @Query('daysBefore') daysBefore?: string,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      return { count: 0 };
    }
    const days = parseInt(daysBefore || '7', 10);
    return this.gymSubscriptionsService.getExpiringCount(tenantId, days);
  }

  @Get(':memberId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getCurrentSubscription(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      return null;
    }
    return this.gymSubscriptionsService.getCurrentSubscription(
      memberId,
      tenantId,
    );
  }

  @Get(':memberId/history')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionHistory(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      return [];
    }
    return this.gymSubscriptionsService.getSubscriptionHistory(
      memberId,
      tenantId,
    );
  }

  @Get(':memberId/transactions')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getMemberTransactions(
    @Param('memberId') memberId: string,
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      return [];
    }
    return this.gymSubscriptionsService.getMemberTransactions(
      memberId,
      tenantId,
    );
  }

  @Post(':memberId/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  renewMembership(
    @Param('memberId') memberId: string,
    @Body() renewDto: { gymMembershipPlanId: string },
    @Req() req: RequestWithUser,
  ) {
    // Get authenticated user info
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    const userId = req.user?.id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.gymSubscriptionsService.renewMembership(
      memberId,
      renewDto.gymMembershipPlanId,
      tenantId,
      userId,
      'cash', // v1: Only CASH payments
    );
  }

  @Post(':memberId/change-plan')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  changePlan(
    @Param('memberId') memberId: string,
    @Body() changePlanDto: ChangePlanDto,
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    const userId = req.user?.id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.gymSubscriptionsService.changePlan(
      memberId,
      changePlanDto.gymMembershipPlanId,
      changePlanDto.paymentAmount,
      changePlanDto.paymentMethod,
      tenantId,
      userId,
    );
  }

  @Post(':memberId/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  cancelMembership(
    @Param('memberId') memberId: string,
    @Body()
    cancelDto: { cancellationReason?: string; cancellationNotes?: string },
    @Req() req: RequestWithUser,
  ) {
    const tenantId =
      req.user?.tenantId || (req.headers['x-tenant-id'] as string);
    const userId = req.user?.id;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.gymSubscriptionsService.cancelMembership(
      memberId,
      tenantId,
      userId,
      cancelDto.cancellationReason,
      cancelDto.cancellationNotes,
    );
  }
}

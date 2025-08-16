import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GymSubscriptionsService } from './gym-subscriptions.service';
import { AuthGuard } from '../../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { RequestWithUser } from '../../../types/express';
import '../../../types/express';

@Controller('gym/subscriptions')
@UseGuards(AuthGuard, RBACGuard)
export class GymSubscriptionsController {
  constructor(private readonly gymSubscriptionsService: GymSubscriptionsService) {}

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionStats(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    // For Super Admin or users without tenantId, return empty stats
    if (!tenantId) {
      return { total: 0, active: 0, expired: 0, cancelled: 0 };
    }
    return this.gymSubscriptionsService.getSubscriptionStats(tenantId);
  }

  @Get(':memberId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getCurrentSubscription(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return null;
    }
    return this.gymSubscriptionsService.getCurrentSubscription(memberId, tenantId);
  }

  @Get(':memberId/history')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionHistory(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return [];
    }
    return this.gymSubscriptionsService.getSubscriptionHistory(memberId, tenantId);
  }

  @Get(':memberId/transactions')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getMemberTransactions(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return [];
    }
    return this.gymSubscriptionsService.getMemberTransactions(memberId, tenantId);
  }

  @Post(':memberId/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  renewMembership(
    @Param('memberId') memberId: string,
    @Body() renewDto: { membershipPlanId: string; paymentMethod?: string },
    @Req() req: RequestWithUser
  ) {
    // Get authenticated user info
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    const userId = req.user?.id;
    
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    return this.gymSubscriptionsService.renewMembership(
      memberId,
      renewDto.membershipPlanId,
      tenantId,
      userId,
      renewDto.paymentMethod || 'cash'
    );
  }

  @Post(':memberId/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  cancelMembership(
    @Param('memberId') memberId: string,
    @Body() cancelDto: { cancellationReason?: string; cancellationNotes?: string },
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
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
      cancelDto.cancellationNotes
    );
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: Role;
    email: string;
  };
  tenantId?: string;
}

@Controller('customer-subscriptions')
@UseGuards(AuthGuard, RBACGuard)
export class CustomerSubscriptionsController {
  constructor(private readonly customerSubscriptionsService: CustomerSubscriptionsService) {}

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionStats(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    // For Super Admin or users without tenantId, return empty stats
    if (!tenantId) {
      return { total: 0, active: 0, expired: 0, cancelled: 0 };
    }
    return this.customerSubscriptionsService.getSubscriptionStats(tenantId);
  }

  @Get(':customerId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getCurrentSubscription(@Param('customerId') customerId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return null;
    }
    return this.customerSubscriptionsService.getCurrentSubscription(customerId, tenantId);
  }

  @Get(':customerId/history')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getSubscriptionHistory(@Param('customerId') customerId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return [];
    }
    return this.customerSubscriptionsService.getSubscriptionHistory(customerId, tenantId);
  }

  @Get(':customerId/transactions')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  getCustomerTransactions(@Param('customerId') customerId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return [];
    }
    return this.customerSubscriptionsService.getCustomerTransactions(customerId, tenantId);
  }

  @Post(':customerId/renew')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  renewMembership(
    @Param('customerId') customerId: string,
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
    
    return this.customerSubscriptionsService.renewMembership(
      customerId,
      renewDto.membershipPlanId,
      tenantId,
      userId,
      renewDto.paymentMethod || 'cash'
    );
  }

  @Post(':customerId/cancel')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  cancelMembership(
    @Param('customerId') customerId: string,
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
    
    return this.customerSubscriptionsService.cancelMembership(
      customerId,
      tenantId,
      userId,
      cancelDto.cancellationReason,
      cancelDto.cancellationNotes
    );
  }
}

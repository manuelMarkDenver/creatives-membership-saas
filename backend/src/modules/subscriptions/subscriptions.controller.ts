import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { AuthGuard } from '../../core/auth/auth.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';

interface RequestWithTenant extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

@Controller('subscriptions')
@UseGuards(AuthGuard, RBACGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('tenant/status')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN)
  async getTenantSubscriptionStatus(@Req() req: RequestWithTenant) {
    // Super Admins don't belong to a specific tenant
    if (!req.tenantId) {
      return {
        message:
          'Super Admin users do not have tenant-specific subscription status',
        data: null,
      };
    }
    return this.subscriptionsService.getTenantSubscriptionStatus(req.tenantId);
  }

  @Get('tenant/:tenantId/can-create-branch')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async canCreateBranch(@Param('tenantId') tenantId: string, @Req() req: any) {
    // Get user from request (set by auth guard)
    const user = req.user;
    const userRole = user?.role;
    const userTenantId = user?.tenantId;

    // Debug logging
    console.log(
      '🔍 canCreateBranch - req.user:',
      JSON.stringify(user, null, 2),
    );
    console.log('🔍 userTenantId:', userTenantId);
    console.log('🔍 requested tenantId:', tenantId);

    // Super admins can check any tenant
    if (userRole === Role.SUPER_ADMIN) {
      return this.subscriptionsService.canCreateBranch(tenantId);
    }

    // Owners and managers can only check their own tenant
    if (!userTenantId) {
      console.error('❌ User tenantId is missing from req.user');
      throw new Error('Access denied: User tenant not found');
    }

    if (userTenantId !== tenantId) {
      throw new Error(
        `Access denied: Cannot check subscription status for other tenants (your tenant: ${userTenantId}, requested: ${tenantId})`,
      );
    }

    return this.subscriptionsService.canCreateBranch(tenantId);
  }

  // Super Admin CRUD operations for subscriptions
  @Get('system/all')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getAllSubscriptions(
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.subscriptionsService.getAllSubscriptions({
      status,
      planId,
      tenantId,
    });
  }

  @Get(':id')
  @RequiredRoles(Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER)
  async getSubscriptionById(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN)
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(createSubscriptionDto);
  }

  @Put(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.updateSubscription(
      id,
      updateSubscriptionDto,
    );
  }

  @Delete(':id')
  @RequiredRoles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubscription(@Param('id') id: string) {
    return this.subscriptionsService.deleteSubscription(id);
  }

  @Put(':id/status')
  @RequiredRoles(Role.SUPER_ADMIN)
  async updateSubscriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.subscriptionsService.updateSubscriptionStatus(id, body.status);
  }

  @Post(':id/extend')
  @RequiredRoles(Role.SUPER_ADMIN)
  async extendSubscription(
    @Param('id') id: string,
    @Body() body: { days: number },
  ) {
    return this.subscriptionsService.extendSubscription(id, body.days);
  }

  @Get('expiring/soon')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getExpiringSoon(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.subscriptionsService.getExpiringSoon(daysNumber);
  }
}

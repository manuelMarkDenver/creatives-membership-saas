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
  async canCreateBranch(@Param('tenantId') tenantId: string, @Req() req: RequestWithTenant) {
    // Verify user has access to this tenant (unless SUPER_ADMIN)
    const userRole = (req as any).user?.role;
    if (userRole !== Role.SUPER_ADMIN && req.tenantId !== tenantId) {
      throw new Error('Access denied: Cannot check subscription status for other tenants');
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

import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { StatsService } from './stats.service';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { AuthGuard } from '../../core/auth/auth.guard';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface RequestWithTenant extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

@Controller('stats')
@UseGuards(AuthGuard, RBACGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('system/overview')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemOverview() {
    return this.statsService.getSystemOverview();
  }

  @Get('system/branches')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemBranchStats() {
    return this.statsService.getSystemBranchStats();
  }

  @Get('system/members')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemMemberStats() {
    return this.statsService.getSystemMemberStats();
  }

  @Get('system/staff')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemStaffStats() {
    return this.statsService.getSystemStaffStats();
  }

  @Get('system/subscriptions')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getSystemSubscriptionStats() {
    return this.statsService.getSystemSubscriptionStats();
  }

  @Get('tenant/dashboard')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async getTenantDashboard(@Req() req: RequestWithTenant) {
    if (!req.tenantId) {
      throw new Error('Tenant not found in request');
    }
    return this.statsService.getTenantDashboard(req.tenantId);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BusinessUnitsService } from './business-units.service';
import type { CreateBusinessUnitDto, UpdateBusinessUnitDto } from './business-units.service';
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

interface TogglePaidModeDto {
  enabled: boolean;
}

interface UpgradeToPaidDto {
  paymentMethod: string;
  paymentReference?: string;
}

@Controller('business-units')
@UseGuards(AuthGuard, RBACGuard)
export class BusinessUnitsController {
  constructor(private readonly businessUnitsService: BusinessUnitsService) {}

  @Get()
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getBusinessUnits(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.getBusinessUnits(tenantId);
  }

  @Get('stats')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async getTenantStats(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.getTenantStats(tenantId);
  }

  @Get('can-create')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async canCreateBusinessUnit(@Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.canCreateBusinessUnit(tenantId);
  }

  @Get(':unitId')
  @RequiredRoles(Role.OWNER, Role.MANAGER, Role.STAFF)
  async getBusinessUnit(@Param('unitId') unitId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.getBusinessUnit(unitId, tenantId);
  }

  @Post()
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async createBusinessUnit(@Body() createDto: CreateBusinessUnitDto, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    createDto.tenantId = tenantId; // Ensure correct tenant
    return this.businessUnitsService.createBusinessUnit(createDto);
  }

  @Put(':unitId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async updateBusinessUnit(
    @Param('unitId') unitId: string,
    @Body() updateDto: UpdateBusinessUnitDto,
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.updateBusinessUnit(unitId, tenantId, updateDto);
  }

  @Delete(':unitId')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async deleteBusinessUnit(@Param('unitId') unitId: string, @Req() req: RequestWithUser) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.deleteBusinessUnit(unitId, tenantId);
  }

  @Post(':unitId/upgrade-to-paid')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async upgradeToPaid(
    @Param('unitId') unitId: string,
    @Body() upgradeDto: UpgradeToPaidDto,
    @Req() req: RequestWithUser
  ) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.businessUnitsService.upgradeToPaid(unitId, tenantId, upgradeDto);
  }

  // Admin-only endpoints for paid mode management
  @Post('admin/toggle-paid-mode/:tenantId')
  @RequiredRoles(Role.SUPER_ADMIN)
  async togglePaidMode(
    @Param('tenantId') tenantId: string,
    @Body() toggleDto: TogglePaidModeDto,
    @Req() req: RequestWithUser
  ) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new Error('Admin ID is required');
    }
    return this.businessUnitsService.togglePaidMode(tenantId, toggleDto.enabled, adminId);
  }

  @Get('admin/tenant-stats/:tenantId')
  @RequiredRoles(Role.SUPER_ADMIN)
  async getAdminTenantStats(@Param('tenantId') tenantId: string) {
    return this.businessUnitsService.getTenantStats(tenantId);
  }
}

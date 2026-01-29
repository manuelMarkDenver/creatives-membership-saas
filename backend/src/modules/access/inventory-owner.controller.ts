import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { Role } from '@prisma/client';
import { InventoryCardsService } from './inventory-cards.service';

@Controller('inventory')
@UseGuards(AuthGuard, RBACGuard)
export class InventoryOwnerController {
  constructor(private inventoryCardsService: InventoryCardsService) {}

  @Get('summary')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async summary(@Req() req: any, @Query('branchId') branchId?: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.inventoryCardsService.getTenantInventorySummary({
      tenantId,
      branchId: branchId || undefined,
    });
  }

  @Get('assigned')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async assigned(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.inventoryCardsService.listAssignedCardsForTenant({
      tenantId,
      branchId: branchId || undefined,
      q: q || undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('available')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async available(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.inventoryCardsService.listAvailableInventoryForTenant({
      tenantId,
      branchId: branchId || undefined,
      q: q || undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }
}

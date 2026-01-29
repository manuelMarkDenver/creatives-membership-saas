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
  async summary(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.inventoryCardsService.getTenantInventorySummary({ tenantId });
  }

  @Get('assigned')
  @RequiredRoles(Role.OWNER, Role.MANAGER)
  async assigned(
    @Req() req: any,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.inventoryCardsService.listAssignedCardsForTenant({
      tenantId,
      branchId: branchId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

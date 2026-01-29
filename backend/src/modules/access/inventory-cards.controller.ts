import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import { RBACGuard, RequiredRoles } from '../../core/guard/rbac.guard';
import { InventoryCardStatus, Role } from '@prisma/client';
import { InventoryCardsService } from './inventory-cards.service';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { id: string; role: Role };
}

@Controller('admin/inventory-cards')
@UseGuards(AuthGuard, RBACGuard)
export class InventoryCardsController {
  constructor(private inventoryCardsService: InventoryCardsService) {}

  @Get()
  @RequiredRoles(Role.SUPER_ADMIN)
  async list(
    @Query('tenantId') tenantId: string,
    @Query('branchId') branchId: string,
    @Query('status') status?: InventoryCardStatus,
    @Query('batchId') batchId?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!tenantId || !branchId) {
      throw new BadRequestException('tenantId and branchId are required');
    }

    return this.inventoryCardsService.list({
      tenantId,
      branchId,
      status,
      batchId,
      q,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @RequiredRoles(Role.SUPER_ADMIN)
  async createOne(
    @Body()
    body: { tenantId: string; branchId: string; uid: string; batchId?: string },
    @Req() req: RequestWithUser,
  ) {
    if (!body?.tenantId || !body?.branchId || !body?.uid) {
      throw new BadRequestException('tenantId, branchId, and uid are required');
    }

    return this.inventoryCardsService.createOne({
      tenantId: body.tenantId,
      branchId: body.branchId,
      uid: body.uid,
      batchId: body.batchId,
      performedByUserId: req.user?.id,
    });
  }

  @Post('bulk')
  @RequiredRoles(Role.SUPER_ADMIN)
  async createBulk(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      uids: string[];
      batchId?: string;
    },
    @Req() req: RequestWithUser,
  ) {
    if (!body?.tenantId || !body?.branchId) {
      throw new BadRequestException('tenantId and branchId are required');
    }

    return this.inventoryCardsService.createBulk({
      tenantId: body.tenantId,
      branchId: body.branchId,
      uids: body.uids,
      batchId: body.batchId,
      performedByUserId: req.user?.id,
    });
  }

  @Post('batch/status')
  @RequiredRoles(Role.SUPER_ADMIN)
  async setBatchStatus(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      batchId: string;
      status: InventoryCardStatus;
    },
    @Req() req: RequestWithUser,
  ) {
    if (!body?.tenantId || !body?.branchId || !body?.batchId || !body?.status) {
      throw new BadRequestException(
        'tenantId, branchId, batchId, and status are required',
      );
    }

    return this.inventoryCardsService.setStatusForBatch({
      tenantId: body.tenantId,
      branchId: body.branchId,
      batchId: body.batchId,
      status: body.status,
      performedByUserId: req.user?.id,
    });
  }

  @Post('move')
  @RequiredRoles(Role.SUPER_ADMIN)
  async moveAvailable(
    @Body()
    body: {
      tenantId: string;
      fromBranchId: string;
      toBranchId: string;
      uid?: string;
      batchId?: string;
    },
    @Req() req: RequestWithUser,
  ) {
    if (!body?.tenantId || !body?.fromBranchId || !body?.toBranchId) {
      throw new BadRequestException(
        'tenantId, fromBranchId, and toBranchId are required',
      );
    }

    return this.inventoryCardsService.moveAvailable({
      tenantId: body.tenantId,
      fromBranchId: body.fromBranchId,
      toBranchId: body.toBranchId,
      uid: body.uid,
      batchId: body.batchId,
      performedByUserId: req.user?.id,
    });
  }
}

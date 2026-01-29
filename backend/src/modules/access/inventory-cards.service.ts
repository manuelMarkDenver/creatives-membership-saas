import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryCardStatus } from '@prisma/client';

@Injectable()
export class InventoryCardsService {
  constructor(private prisma: PrismaService) {}

  private async assertBranchInTenant(params: { tenantId: string; branchId: string }) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: params.branchId, tenantId: params.tenantId, isActive: true },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException(
        'Invalid branchId for tenantId (not found, inactive, or mismatched tenant)',
      );
    }
  }

  async list(params: {
    tenantId: string;
    branchId: string;
    status?: InventoryCardStatus;
    batchId?: string;
    q?: string;
    limit?: number;
  }) {
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });

    const limit = Math.min(Math.max(params.limit ?? 200, 1), 1000);
    const q = params.q?.trim();

    return this.prisma.inventoryCard.findMany({
      where: {
        allocatedGymId: params.branchId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.batchId ? { batchId: params.batchId } : {}),
        ...(q ? { uid: { contains: q } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createOne(params: {
    tenantId: string;
    branchId: string;
    uid: string;
    batchId?: string;
    performedByUserId?: string;
  }) {
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });

    const uid = params.uid?.trim();
    if (!uid) {
      throw new BadRequestException('uid is required');
    }

    const card = await this.prisma.inventoryCard.create({
      data: {
        uid,
        allocatedGymId: params.branchId,
        batchId: params.batchId?.trim() || null,
        status: 'AVAILABLE',
      },
    });

    await this.prisma.event.create({
      data: {
        gymId: params.branchId,
        type: 'INVENTORY_CARD_CREATED',
        actorUserId: params.performedByUserId,
        cardUid: uid,
        meta: { batchId: card.batchId },
      },
    });

    return card;
  }

  async createBulk(params: {
    tenantId: string;
    branchId: string;
    uids: string[];
    batchId?: string;
    performedByUserId?: string;
  }) {
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });

    if (!Array.isArray(params.uids) || params.uids.length === 0) {
      throw new BadRequestException('uids must be a non-empty array');
    }

    const normalized = Array.from(
      new Set(params.uids.map((u) => (u || '').trim()).filter(Boolean)),
    );

    if (normalized.length === 0) {
      throw new BadRequestException('No valid uids found');
    }

    const batchId = params.batchId?.trim() || null;

    const result = await this.prisma.inventoryCard.createMany({
      data: normalized.map((uid) => ({
        uid,
        allocatedGymId: params.branchId,
        batchId,
        status: 'AVAILABLE',
      })),
      skipDuplicates: true,
    });

    await this.prisma.event.create({
      data: {
        gymId: params.branchId,
        type: 'INVENTORY_CARD_BULK_CREATED',
        actorUserId: params.performedByUserId,
        meta: { batchId, requested: normalized.length, created: result.count },
      },
    });

    return {
      requested: normalized.length,
      created: result.count,
      batchId,
    };
  }

  async setStatusForBatch(params: {
    tenantId: string;
    branchId: string;
    batchId: string;
    status: InventoryCardStatus;
    performedByUserId?: string;
  }) {
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });

    const batchId = params.batchId?.trim();
    if (!batchId) {
      throw new BadRequestException('batchId is required');
    }

    const updated = await this.prisma.inventoryCard.updateMany({
      where: { allocatedGymId: params.branchId, batchId },
      data: { status: params.status },
    });

    await this.prisma.event.create({
      data: {
        gymId: params.branchId,
        type: 'INVENTORY_CARD_BATCH_STATUS_UPDATED',
        actorUserId: params.performedByUserId,
        meta: { batchId, status: params.status, updated: updated.count },
      },
    });

    return { batchId, status: params.status, updated: updated.count };
  }

  async moveAvailable(params: {
    tenantId: string;
    fromBranchId: string;
    toBranchId: string;
    uid?: string;
    batchId?: string;
    performedByUserId?: string;
  }) {
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.fromBranchId });
    await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.toBranchId });

    const uid = params.uid?.trim();
    const batchId = params.batchId?.trim();
    if (!uid && !batchId) {
      throw new BadRequestException('uid or batchId is required');
    }

    const updated = await this.prisma.inventoryCard.updateMany({
      where: {
        allocatedGymId: params.fromBranchId,
        status: 'AVAILABLE',
        ...(uid ? { uid } : {}),
        ...(batchId ? { batchId } : {}),
      },
      data: { allocatedGymId: params.toBranchId },
    });

    await this.prisma.event.create({
      data: {
        gymId: params.fromBranchId,
        type: 'INVENTORY_CARD_MOVED',
        actorUserId: params.performedByUserId,
        meta: {
          toBranchId: params.toBranchId,
          uid: uid || null,
          batchId: batchId || null,
          updated: updated.count,
        },
      },
    });

    return {
      moved: updated.count,
      fromBranchId: params.fromBranchId,
      toBranchId: params.toBranchId,
      uid: uid || null,
      batchId: batchId || null,
    };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryCardStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryCardsService {
  constructor(private prisma: PrismaService) {}

  private buildSingleOutcome(params: {
    uid: string;
    targetBranchId: string;
    inventoryCard: null | {
      uid: string;
      status: InventoryCardStatus;
      allocatedGymId: string;
      batchId: string | null;
    };
    card: null | {
      uid: string;
      gymId: string;
      memberId: string | null;
      active: boolean;
    };
    attemptedCreate: boolean;
    created: boolean;
  }) {
    if (params.inventoryCard) {
      return {
        uid: params.uid,
        action: 'SKIPPED' as const,
        reason:
          params.inventoryCard.allocatedGymId === params.targetBranchId
            ? 'ALREADY_IN_INVENTORY_TARGET_BRANCH'
            : 'ALREADY_IN_INVENTORY_OTHER_BRANCH',
        inventory: {
          status: params.inventoryCard.status,
          allocatedGymId: params.inventoryCard.allocatedGymId,
          batchId: params.inventoryCard.batchId,
        },
      };
    }

    if (params.card) {
      return {
        uid: params.uid,
        action: 'SKIPPED' as const,
        reason: 'ALREADY_IN_CARDS_TABLE',
        card: {
          gymId: params.card.gymId,
          active: params.card.active,
          memberId: params.card.memberId,
        },
      };
    }

    if (!params.attemptedCreate) {
      return {
        uid: params.uid,
        action: 'SKIPPED' as const,
        reason: 'NOT_ATTEMPTED',
      };
    }

    return {
      uid: params.uid,
      action: params.created ? ('CREATED' as const) : ('ATTEMPTED_CREATE' as const),
      reason: params.created ? 'CREATED' : 'UNKNOWN',
    };
  }

  private async createOneWithFeedback(params: {
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

    // If the card already exists in operational cards, don't create inventory for it.
    const existingCard = await this.prisma.card.findUnique({
      where: { uid },
      select: { uid: true, gymId: true, memberId: true, active: true },
    });

    if (existingCard) {
      return {
        batchId: params.batchId?.trim() || null,
        requested: 1,
        unique: 1,
        created: 0,
        outcomes: [
          this.buildSingleOutcome({
            uid,
            targetBranchId: params.branchId,
            inventoryCard: null,
            card: existingCard,
            attemptedCreate: false,
            created: false,
          }),
        ],
      };
    }

    try {
      const createdInventory = await this.prisma.inventoryCard.create({
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
          meta: { batchId: createdInventory.batchId, mode: 'single' },
        },
      });

      return {
        batchId: createdInventory.batchId,
        requested: 1,
        unique: 1,
        created: 1,
        outcomes: [
          this.buildSingleOutcome({
            uid,
            targetBranchId: params.branchId,
            inventoryCard: null,
            card: null,
            attemptedCreate: true,
            created: true,
          }),
        ],
      };
    } catch (error) {
      // Unique constraint means uid already exists in InventoryCard.
      const isUnique =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002';

      if (!isUnique) {
        throw error;
      }

      const existingInventory = await this.prisma.inventoryCard.findUnique({
        where: { uid },
        select: {
          uid: true,
          status: true,
          allocatedGymId: true,
          batchId: true,
        },
      });

      return {
        batchId: params.batchId?.trim() || null,
        requested: 1,
        unique: 1,
        created: 0,
        outcomes: [
          this.buildSingleOutcome({
            uid,
            targetBranchId: params.branchId,
            inventoryCard: existingInventory,
            card: null,
            attemptedCreate: true,
            created: false,
          }),
        ],
      };
    }
  }

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
    // Return the plain created card if possible; otherwise throw a descriptive error.
    const res = await this.createOneWithFeedback(params);
    const outcome = res.outcomes[0];
    if (outcome.action === 'CREATED') {
      return this.prisma.inventoryCard.findUnique({ where: { uid: outcome.uid } });
    }

    throw new BadRequestException({
      message: 'Card uid already exists',
      outcome,
    });
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

    // Single UID path: return exact outcome for better UX (tap mode).
    if (normalized.length === 1) {
      return this.createOneWithFeedback({
        tenantId: params.tenantId,
        branchId: params.branchId,
        uid: normalized[0],
        batchId: batchId || undefined,
        performedByUserId: params.performedByUserId,
      });
    }

    const existingInventory = await this.prisma.inventoryCard.findMany({
      where: { uid: { in: normalized } },
      select: {
        uid: true,
        status: true,
        allocatedGymId: true,
        batchId: true,
      },
    });

    const existingCards = await this.prisma.card.findMany({
      where: { uid: { in: normalized } },
      select: {
        uid: true,
        gymId: true,
        memberId: true,
        active: true,
      },
    });

    const invByUid = new Map(existingInventory.map((c) => [c.uid, c] as const));
    const cardByUid = new Map(existingCards.map((c) => [c.uid, c] as const));

    const toCreate = normalized.filter((uid) => !invByUid.has(uid) && !cardByUid.has(uid));

    const result = await this.prisma.inventoryCard.createMany({
      data: toCreate.map((uid) => ({
        uid,
        allocatedGymId: params.branchId,
        batchId,
        status: 'AVAILABLE',
      })),
      skipDuplicates: true,
    });

    const invTarget = existingInventory.filter((c) => c.allocatedGymId === params.branchId);
    const invOther = existingInventory.filter((c) => c.allocatedGymId !== params.branchId);

    const byStatus = (rows: Array<{ status: InventoryCardStatus }>) =>
      rows.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const outcomes = normalized.slice(0, 200).map((uid) =>
      this.buildSingleOutcome({
        uid,
        targetBranchId: params.branchId,
        inventoryCard: invByUid.get(uid) || null,
        card: cardByUid.get(uid) || null,
        attemptedCreate: toCreate.includes(uid),
        created: false,
      }),
    );

    await this.prisma.event.create({
      data: {
        gymId: params.branchId,
        type: 'INVENTORY_CARD_BULK_CREATED',
        actorUserId: params.performedByUserId,
        meta: {
          batchId,
          requested: normalized.length,
          unique: normalized.length,
          attemptedCreate: toCreate.length,
          created: result.count,
          skippedInventory: existingInventory.length,
          skippedCardsTable: existingCards.length,
        },
      },
    });

    return {
      batchId,
      requested: params.uids.length,
      unique: normalized.length,
      attemptedCreate: toCreate.length,
      created: result.count,
      skipped: {
        inventory: {
          total: existingInventory.length,
          targetBranch: { total: invTarget.length, byStatus: byStatus(invTarget) },
          otherBranch: { total: invOther.length, byStatus: byStatus(invOther) },
        },
        cardsTable: {
          total: existingCards.length,
          active: existingCards.filter((c) => c.active).length,
          assignedToMember: existingCards.filter((c) => !!c.memberId).length,
        },
      },
      samples: {
        inventoryTarget: invTarget.slice(0, 25),
        inventoryOther: invOther.slice(0, 25),
        cardsTable: existingCards.slice(0, 25),
      },
      outcomes,
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

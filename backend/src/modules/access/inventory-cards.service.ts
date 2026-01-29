import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryCardStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryCardsService {
  constructor(private prisma: PrismaService) {}

  private async getExcludedUidsForOwnerInventory() {
    // SUPER_ADMIN cards are global/admin-only and should never be surfaced as gym inventory.
    const rows = await this.prisma.card.findMany({
      where: { type: 'SUPER_ADMIN' },
      select: { uid: true },
    });
    return new Set(rows.map((r) => r.uid));
  }

  private maskLast4(uid: string): string {
    const last4 = uid.slice(-4);
    return `•••• ${last4}`;
  }

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

  async getTenantInventorySummary(params: { tenantId: string; branchId?: string }) {
    const excludedUidSet = await this.getExcludedUidsForOwnerInventory();
    const excludedUids = excludedUidSet.size > 0 ? Array.from(excludedUidSet) : null;

    if (params.branchId) {
      await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });
    }

    const branches = await this.prisma.branch.findMany({
      where: {
        tenantId: params.tenantId,
        isActive: true,
        ...(params.branchId ? { id: params.branchId } : {}),
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = await this.prisma.inventoryCard.groupBy({
      by: ['allocatedGymId', 'status'],
      where: {
        gym: { tenantId: params.tenantId },
        ...(params.branchId ? { allocatedGymId: params.branchId } : {}),
        ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      },
      _count: { _all: true },
    });

    const byBranch = new Map<
      string,
      { AVAILABLE: number; ASSIGNED: number; DISABLED: number; total: number }
    >();

    for (const g of grouped) {
      const current = byBranch.get(g.allocatedGymId) || {
        AVAILABLE: 0,
        ASSIGNED: 0,
        DISABLED: 0,
        total: 0,
      };
      const count = g._count._all;
      current[g.status] = (current[g.status] || 0) + count;
      current.total += count;
      byBranch.set(g.allocatedGymId, current);
    }

    // Assigned-to-member (MONTHLY) cards (exclude SUPER_ADMIN, DAILY)
    const assignedToMembersByBranch = await this.prisma.card.groupBy({
      by: ['gymId'],
      where: {
        gym: { tenantId: params.tenantId },
        ...(params.branchId ? { gymId: params.branchId } : {}),
        type: 'MONTHLY',
        memberId: { not: null },
        ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      },
      _count: { _all: true },
    });
    const assignedToMembersMap = new Map(
      assignedToMembersByBranch.map((x) => [x.gymId, x._count._all] as const),
    );

    // DAILY cards are assigned to a branch but not to a member.
    const dailyCardsByBranch = await this.prisma.card.groupBy({
      by: ['gymId'],
      where: {
        gym: { tenantId: params.tenantId },
        ...(params.branchId ? { gymId: params.branchId } : {}),
        type: 'DAILY',
        active: true,
        ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      },
      _count: { _all: true },
    });
    const dailyCardsMap = new Map(
      dailyCardsByBranch.map((x) => [x.gymId, x._count._all] as const),
    );

    // Provide daily card last-4 samples for the selected branch (or per-branch samples when unfiltered)
    const dailyCardSamples = await this.prisma.card.findMany({
      where: {
        gym: { tenantId: params.tenantId },
        ...(params.branchId ? { gymId: params.branchId } : {}),
        type: 'DAILY',
        active: true,
        ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      },
      select: { uid: true, gymId: true },
      orderBy: { createdAt: 'desc' },
      take: params.branchId ? 10 : 50,
    });
    const dailySamplesByBranch = new Map<string, string[]>();
    for (const row of dailyCardSamples) {
      const list = dailySamplesByBranch.get(row.gymId) || [];
      if (list.length < 10) {
        list.push(this.maskLast4(row.uid));
        dailySamplesByBranch.set(row.gymId, list);
      }
    }

    const branchSummaries = branches.map((b) => {
      const counts = byBranch.get(b.id) || {
        AVAILABLE: 0,
        ASSIGNED: 0,
        DISABLED: 0,
        total: 0,
      };

      const assignedToMembers = assignedToMembersMap.get(b.id) || 0;
      const dailyCards = dailyCardsMap.get(b.id) || 0;
      const dailyCardLast4 = dailySamplesByBranch.get(b.id) || [];

      return {
        branchId: b.id,
        branchName: b.name,
        total: counts.total,
        available: counts.AVAILABLE,
        inventoryAssigned: counts.ASSIGNED,
        disabled: counts.DISABLED,
        assignedToMembers,
        dailyCards,
        dailyCardLast4,
      };
    });

    const totals = branchSummaries.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.available += s.available;
        acc.inventoryAssigned += s.inventoryAssigned;
        acc.disabled += s.disabled;
        acc.assignedToMembers += s.assignedToMembers;
        acc.dailyCards += s.dailyCards;
        return acc;
      },
      {
        total: 0,
        available: 0,
        inventoryAssigned: 0,
        disabled: 0,
        assignedToMembers: 0,
        dailyCards: 0,
      },
    );

    return {
      tenantId: params.tenantId,
      branchId: params.branchId || null,
      totals,
      branches: branchSummaries,
    };
  }

  async listAssignedCardsForTenant(params: {
    tenantId: string;
    branchId?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const excludedUidSet = await this.getExcludedUidsForOwnerInventory();
    const excludedUids = excludedUidSet.size > 0 ? Array.from(excludedUidSet) : null;

    const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
    const page = Math.max(params.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    const q = params.q?.trim();

    if (params.branchId) {
      await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });
    }

    const where = {
      gym: { tenantId: params.tenantId },
      ...(params.branchId ? { gymId: params.branchId } : {}),
      memberId: { not: null },
      type: { notIn: ['SUPER_ADMIN', 'DAILY'] as any },
      ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      ...(q
        ? {
            OR: [
              { uid: { contains: q, mode: 'insensitive' as any } },
              { member: { firstName: { contains: q, mode: 'insensitive' as any } } },
              { member: { lastName: { contains: q, mode: 'insensitive' as any } } },
              { member: { email: { contains: q, mode: 'insensitive' as any } } },
              {
                member: {
                  AND: [
                    { firstName: { contains: q.split(' ')[0] || q, mode: 'insensitive' as any } },
                    { lastName: { contains: q.split(' ').slice(1).join(' ') || q, mode: 'insensitive' as any } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const total = await this.prisma.card.count({ where: where as any });

    const cards = await this.prisma.card.findMany({
      where: where as any,
      include: {
        gym: { select: { id: true, name: true } },
        member: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    const uids = cards.map((c) => c.uid);
    const inventory = await this.prisma.inventoryCard.findMany({
      where: { uid: { in: uids } },
      select: { uid: true, status: true, allocatedGymId: true, batchId: true },
    });
    const invByUid = new Map(inventory.map((i) => [i.uid, i] as const));

    return {
      tenantId: params.tenantId,
      branchId: params.branchId || null,
      page,
      pageSize,
      total,
      count: cards.length,
      items: cards.map((c) => {
        const inv = invByUid.get(c.uid);
        return {
          uid: c.uid,
          type: c.type,
          active: c.active,
          assignedAt: c.createdAt,
          branchId: c.gymId,
          branchName: c.gym?.name,
          memberId: c.memberId,
          memberName: c.member ? `${c.member.firstName} ${c.member.lastName}` : null,
          memberEmail: c.member?.email || null,
          inventory: inv
            ? {
                status: inv.status,
                allocatedGymId: inv.allocatedGymId,
                batchId: inv.batchId,
              }
            : null,
        };
      }),
    };
  }

  async listAvailableInventoryForTenant(params: {
    tenantId: string;
    branchId?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const excludedUidSet = await this.getExcludedUidsForOwnerInventory();
    const excludedUids = excludedUidSet.size > 0 ? Array.from(excludedUidSet) : null;

    const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
    const page = Math.max(params.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    const q = params.q?.trim();

    if (params.branchId) {
      await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });
    }

    const where = {
      gym: { tenantId: params.tenantId },
      ...(params.branchId ? { allocatedGymId: params.branchId } : {}),
      status: 'AVAILABLE' as const,
      ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      ...(q ? { uid: { contains: q, mode: 'insensitive' as any } } : {}),
    };

    const total = await this.prisma.inventoryCard.count({ where: where as any });

    const items = await this.prisma.inventoryCard.findMany({
      where: where as any,
      include: { gym: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return {
      tenantId: params.tenantId,
      branchId: params.branchId || null,
      page,
      pageSize,
      total,
      count: items.length,
      items: items.map((c) => ({
        uid: c.uid,
        status: c.status,
        batchId: c.batchId,
        createdAt: c.createdAt,
        branchId: c.allocatedGymId,
        branchName: c.gym?.name,
      })),
    };
  }

  async listDailyCardsForTenant(params: {
    tenantId: string;
    branchId?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    const excludedUidSet = await this.getExcludedUidsForOwnerInventory();
    const excludedUids = excludedUidSet.size > 0 ? Array.from(excludedUidSet) : null;

    const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
    const page = Math.max(params.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    const q = params.q?.trim();

    if (params.branchId) {
      await this.assertBranchInTenant({ tenantId: params.tenantId, branchId: params.branchId });
    }

    const where = {
      gym: { tenantId: params.tenantId },
      ...(params.branchId ? { gymId: params.branchId } : {}),
      type: 'DAILY' as any,
      active: true,
      ...(excludedUids ? { uid: { notIn: excludedUids } } : {}),
      ...(q ? { uid: { contains: q, mode: 'insensitive' as any } } : {}),
    };

    const total = await this.prisma.card.count({ where: where as any });
    const cards = await this.prisma.card.findMany({
      where: where as any,
      include: { gym: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return {
      tenantId: params.tenantId,
      branchId: params.branchId || null,
      page,
      pageSize,
      total,
      count: cards.length,
      items: cards.map((c) => ({
        uidLast4: this.maskLast4(c.uid),
        active: c.active,
        branchId: c.gymId,
        branchName: c.gym?.name,
        createdAt: c.createdAt,
      })),
    };
  }
}

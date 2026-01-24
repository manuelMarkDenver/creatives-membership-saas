import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TerminalsService } from './terminals.service';
import { EventsService } from './events.service';
import { CardAssignmentService } from './card-assignment.service';

@Injectable()
export class AccessService {
  constructor(
    private prisma: PrismaService,
    private terminalsService: TerminalsService,
    private eventsService: EventsService,
    private cardAssignmentService: CardAssignmentService,
  ) {}

  async checkAccess(terminalId: string, encodedCardUid: string) {
    console.log(
      'Checking access for terminal:',
      terminalId,
      'raw encodedCardUid:',
      encodedCardUid,
    );

    // Try to decode if base64, otherwise use as is
    let cardUid: string;
    console.log('🔍 Raw encodedCardUid received:', encodedCardUid);

    try {
      const decodedAttempt = Buffer.from(encodedCardUid, 'base64').toString(
        'utf-8',
      );
      console.log('🔄 Base64 decode attempt:', decodedAttempt);

      // Check if it looks valid (not gibberish and reasonable length)
      if (
        decodedAttempt.length > 0 &&
        decodedAttempt.length < 50 &&
        !decodedAttempt.includes('\ufffd') &&
        /^\d+$/.test(decodedAttempt) // Should be numeric
      ) {
        cardUid = decodedAttempt;
        console.log('✅ Using decoded cardUid:', cardUid);
      } else {
        // Not valid base64 result, use as plain
        cardUid = encodedCardUid;
        console.log('📝 Using plain cardUid (invalid base64):', cardUid);
      }
    } catch (error) {
      // Not base64, use as plain
      cardUid = encodedCardUid;
      console.log(
        '📝 Using plain cardUid (decode error):',
        cardUid,
        'Error:',
        error.message,
      );
    }

    console.log('🎯 Final cardUid used:', cardUid);

    // Terminal already validated by guard
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: { gym: true },
    });
    if (!terminal) throw new Error('Terminal not found');
    const gymId = terminal.gymId;
    console.log('Terminal gymId:', gymId, 'Terminal ID:', terminalId);

    // If there's an active RECLAIM pending assignment, handle it first.
    // This must run before the operational-card checks so a disabled/expired operational card
    // does not block the reclaim flow.
    const reclaimPending = await this.prisma.pendingMemberAssignment.findUnique({
      where: { gymId },
      include: { member: true },
    });

    if (reclaimPending?.purpose === 'RECLAIM') {
      // Check if expired
      if (new Date() > reclaimPending.expiresAt) {
        await this.prisma.pendingMemberAssignment.delete({ where: { gymId } });
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'PENDING_ASSIGNMENT_EXPIRED',
          cardUid,
          memberId: reclaimPending.memberId,
          meta: { purpose: 'RECLAIM' },
        });
        return { result: 'DENY_UNKNOWN' };
      }

      // Check inventory first for disabled status (disabled beats unknown)
      const inventoryCard = await this.prisma.inventoryCard.findUnique({
        where: { uid: cardUid },
        include: { gym: true },
      });

      if (inventoryCard && inventoryCard.status === 'DISABLED') {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_DISABLED',
          cardUid,
          memberId: reclaimPending.memberId,
        });
        return { result: 'DENY_DISABLED', memberName: 'Unknown Member' };
      }

      // Check if UID matches expected
      if (cardUid !== reclaimPending.expectedCardUid) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_RECLAIM_MISMATCH',
          cardUid,
          memberId: reclaimPending.memberId,
          meta: {
            expectedUid: reclaimPending.expectedCardUid,
            tappedUid: cardUid,
          },
        });

        return {
          result: 'DENY_RECLAIM_MISMATCH',
          memberName: reclaimPending.member
            ? `${reclaimPending.member.firstName} ${reclaimPending.member.lastName}`
            : 'Unknown Member',
          message:
            'Wrong card for reclaim. Tap the returned card assigned to this member.',
        };
      }

      // UID matches, now check inventory
      if (!inventoryCard) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_UNKNOWN',
          cardUid,
          memberId: reclaimPending.memberId,
        });
        return { result: 'DENY_UNKNOWN' };
      }

      // Reclaim: set inventory to AVAILABLE, delete pending, delete operational card row
      await this.prisma.$transaction(async (tx) => {
        await tx.pendingMemberAssignment.delete({ where: { gymId } });
        await tx.inventoryCard.updateMany({
          where: { uid: cardUid },
          data: { status: 'AVAILABLE' },
        });
        await tx.card.deleteMany({ where: { uid: cardUid } });

        await tx.gymMemberProfile.update({
          where: { userId: reclaimPending.memberId },
          data: { cardStatus: 'NO_CARD', cardUid: null, cardAssignedAt: null },
        });
      });

      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'CARD_RECLAIMED',
        cardUid,
        memberId: reclaimPending.memberId,
        meta: {
          reclaimedUid: cardUid,
          memberId: reclaimPending.memberId,
          inventoryStatus: 'AVAILABLE',
        },
      });

      return {
        result: 'RECLAIMED',
        memberName: reclaimPending.member
          ? `${reclaimPending.member.firstName} ${reclaimPending.member.lastName}`
          : 'Unknown Member',
      };
    }

    // Check cooldown (implement Redis later)
    // For now, skip cooldown check

    // Check if card is operational
    const operationalCard = await this.prisma.card.findUnique({
      where: { uid: cardUid },
      include: { member: true, gym: true },
    });
    console.log(
      'Operational card found:',
      !!operationalCard,
      operationalCard?.gymId === gymId ? 'same gym' : 'different gym',
    );

    // Check for gym/branch mismatches and deny access
    if (operationalCard && operationalCard.gymId !== gymId) {
      // Get member's home branch from profile
      const memberProfile = operationalCard.memberId
        ? await this.prisma.gymMemberProfile.findUnique({
            where: { userId: operationalCard.memberId },
            select: { primaryBranchId: true },
          })
        : null;

      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_GYM_MISMATCH',
        cardUid,
        memberId: operationalCard.memberId || undefined,
        meta: {
          cardGymId: operationalCard.gymId,
          terminalGymId: gymId,
          memberHomeBranchId: memberProfile?.primaryBranchId,
          mismatchType: 'gym',
        },
      });
      console.log(
        `🚨 GYM MISMATCH: Card gym ${operationalCard.gymId} != Terminal gym ${gymId} - ACCESS DENIED`,
      );
      const memberName = operationalCard.member
        ? `${operationalCard.member.firstName || 'Unknown'} ${operationalCard.member.lastName || 'User'}`
        : 'Unknown Member';
      return {
        result: 'DENY_GYM_MISMATCH',
        memberName,
      };
    }

    // Log tenant mismatches for operational cards (same tenant, different gym)
    if (operationalCard) {
      const cardTenantId = operationalCard.gym?.tenantId;
      const terminalTenantId = terminal.gym?.tenantId;

      if (
        cardTenantId &&
        terminalTenantId &&
        cardTenantId !== terminalTenantId
      ) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'TENANT_MISMATCH',
          cardUid,
          memberId: operationalCard.memberId || undefined,
          meta: {
            cardTenantId,
            terminalTenantId,
            cardGymId: operationalCard.gymId,
            terminalGymId: gymId,
            mismatchType: 'tenant',
          },
        });
        console.log(
          `🚨 TENANT MISMATCH: Card tenant ${cardTenantId} != Terminal tenant ${terminalTenantId}`,
        );
      } else if (operationalCard.gymId !== gymId) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'BRANCH_MISMATCH',
          cardUid,
          memberId: operationalCard.memberId || undefined,
          meta: {
            cardGymId: operationalCard.gymId,
            terminalGymId: gymId,
            cardTenantId,
            terminalTenantId,
            mismatchType: 'branch',
          },
        });
        console.log(
          `🚨 BRANCH MISMATCH: Card gym ${operationalCard.gymId} != Terminal gym ${gymId}`,
        );
      }
    }

    if (
      operationalCard &&
      operationalCard.gymId === gymId &&
      operationalCard.active &&
      operationalCard.member
    ) {
      console.log(
        'Card is active, checking subscription for member:',
        operationalCard.memberId,
      );
      // Get the latest subscription (regardless of status) to check expiry
      const subscription = await this.prisma.gymMemberSubscription.findFirst({
        where: {
          memberId: operationalCard.memberId!,
        },
        orderBy: { endDate: 'desc' },
      });

      if (
        subscription &&
        subscription.status === 'ACTIVE' &&
        new Date(subscription.endDate) >= new Date()
      ) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_ALLOW',
          cardUid,
          memberId: operationalCard.memberId!,
        });
        return {
          result: 'ALLOW',
          memberName: `${operationalCard.member.firstName} ${operationalCard.member.lastName}`,
          expiresAt: subscription.endDate.toISOString(),
        };
      } else {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_EXPIRED',
          cardUid,
          memberId: operationalCard.memberId!,
        });
        return {
          result: 'DENY_EXPIRED',
          memberName: `${operationalCard.member.firstName} ${operationalCard.member.lastName}`,
          expiresAt: subscription?.endDate?.toISOString(),
        };
      }
    } else if (
      operationalCard &&
      operationalCard.gymId === gymId &&
      !operationalCard.active
    ) {
      console.log('Card exists but disabled');
      // Card exists but is disabled
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_DISABLED',
        cardUid,
        memberId: operationalCard.memberId!,
      });
      const memberName = operationalCard.member
        ? `${operationalCard.member.firstName || 'Unknown'} ${operationalCard.member.lastName || 'User'}`
        : 'Unknown Member';
      console.log('DENY_DISABLED: memberName =', memberName);
      return {
        result: 'DENY_DISABLED',
        memberName,
      };
    }

    console.log('Card not found or not operational, checking pending');
    console.log('Looking for pending assignment for gymId:', gymId);

    // Not operational - check pending assignment
    const pending = reclaimPending
      ? reclaimPending
      : await this.prisma.pendingMemberAssignment.findUnique({
      where: { gymId },
      include: { member: true },
    });

    console.log('Pending assignment found:', !!pending);
    if (pending) {
      console.log(
        'Pending for member:',
        pending.memberId,
        'expires:',
        pending.expiresAt,
      );
    } else {
      console.log('No pending assignment for this gym');
      // Check if there are any pending assignments at all
      const allPending = await this.prisma.pendingMemberAssignment.findMany();
      console.log('All pending assignments in system:', allPending.length);
      allPending.forEach((p) =>
        console.log('  Gym:', p.gymId, 'Member:', p.memberId),
      );
    }

    if (!pending) {
      console.log(
        '🚨 ACCESS_DENY_UNKNOWN: No pending assignment found for cardUid:',
        cardUid,
        'in gym:',
        gymId,
      );
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_UNKNOWN',
        cardUid,
      });
      return { result: 'DENY_UNKNOWN' };
    }

    // Handle RECLAIM purpose
    if (pending.purpose === 'RECLAIM') {
      // Check if expired
      if (new Date() > pending.expiresAt) {
        await this.prisma.pendingMemberAssignment.delete({ where: { gymId } });
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'PENDING_ASSIGNMENT_EXPIRED',
          cardUid,
          memberId: pending.memberId,
          meta: { purpose: 'RECLAIM' },
        });
        return { result: 'DENY_UNKNOWN' };
      }

      // Check inventory first for disabled status (disabled beats unknown)
      const inventoryCard = await this.prisma.inventoryCard.findUnique({
        where: { uid: cardUid },
        include: { gym: true },
      });

      if (inventoryCard && inventoryCard.status === 'DISABLED') {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_DISABLED',
          cardUid,
          memberId: pending.memberId,
        });
        return { result: 'DENY_DISABLED', memberName: 'Unknown Member' };
      }

      // Check if UID matches expected
      if (cardUid !== pending.expectedCardUid) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_RECLAIM_MISMATCH',
          cardUid,
          memberId: pending.memberId,
          meta: { expectedUid: pending.expectedCardUid, tappedUid: cardUid },
        });

        return {
          result: 'DENY_RECLAIM_MISMATCH',
          memberName: pending.member
            ? `${pending.member.firstName} ${pending.member.lastName}`
            : 'Unknown Member',
          message: 'Wrong card for reclaim. Tap the returned card assigned to this member.',
        };
      }

      // UID matches, now check inventory
      if (!inventoryCard) {
        await this.eventsService.logEvent({
          gymId,
          terminalId,
          type: 'ACCESS_DENY_UNKNOWN',
          cardUid,
          memberId: pending.memberId,
        });
        return { result: 'DENY_UNKNOWN' };
      }

      // Reclaim: set inventory to AVAILABLE, delete pending, log
      await this.prisma.$transaction(async (tx) => {
        await tx.pendingMemberAssignment.delete({ where: { gymId } });
        await tx.inventoryCard.updateMany({
          where: { uid: cardUid },
          data: { status: 'AVAILABLE' },
        });
        await tx.card.deleteMany({ where: { uid: cardUid } });
      });

      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'CARD_RECLAIMED',
        cardUid,
        memberId: pending.memberId,
        meta: {
          reclaimedUid: cardUid,
          memberId: pending.memberId,
          inventoryStatus: 'AVAILABLE',
        },
      });

      return {
        result: 'RECLAIMED',
        memberName: `${pending.member.firstName} ${pending.member.lastName}`,
      };
    }

    // Check if expired (for ONBOARD/REPLACE)
    if (new Date() > pending.expiresAt) {
      await this.prisma.pendingMemberAssignment.delete({ where: { gymId } });
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'PENDING_ASSIGNMENT_EXPIRED',
        cardUid,
        memberId: pending.memberId,
      });
      return { result: 'DENY_UNKNOWN' };
    }

    // Check inventory
    const available =
      await this.cardAssignmentService.checkInventoryAvailability(
        gymId,
        cardUid,
      );
    if (!available) {
      // Log inventory mismatch
      const inventoryCard = await this.prisma.inventoryCard.findUnique({
        where: { uid: cardUid },
        include: { gym: true },
      });

      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'INVENTORY_MISMATCH',
        cardUid,
        memberId: pending.memberId,
        meta: {
          inventoryStatus: inventoryCard?.status,
          allocatedGymId: inventoryCard?.allocatedGymId,
          terminalGymId: gymId,
          allocatedTenantId: inventoryCard?.gym?.tenantId,
          terminalTenantId: terminal.gym?.tenantId,
          mismatchType: 'inventory',
        },
      });
      console.log(
        `🚨 INVENTORY MISMATCH: Card ${cardUid} not available for gym ${gymId}`,
      );

      return { result: 'DENY_UNKNOWN' };
    }

    // Assign card
    const assignmentResult = await this.cardAssignmentService.assignCard(
      gymId,
      pending.memberId,
      cardUid,
      pending.purpose,
      pending.oldCardUid,
    );

    // Get subscription for expiry
    const subscription = await this.prisma.gymMemberSubscription.findFirst({
      where: {
        memberId: pending.memberId,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });

    // Log event based on purpose
    const eventType =
      pending.purpose === 'REPLACE' ? 'CARD_REPLACED' : 'CARD_ASSIGNED';
    await this.eventsService.logEvent({
      gymId,
      terminalId,
      type: eventType,
      cardUid,
      memberId: pending.memberId,
      meta:
        pending.purpose === 'REPLACE'
          ? { oldCardUid: assignmentResult.oldCardUid, newCardUid: cardUid }
          : undefined,
    });

    return {
      result: 'ASSIGNED',
      memberName: `${pending.member.firstName} ${pending.member.lastName}`,
      expiresAt: subscription?.endDate?.toISOString(),
    };
  }
}

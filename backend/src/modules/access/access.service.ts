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
    console.log('Checking access for terminal:', terminalId, 'card input:', encodedCardUid);

    // Try to decode if base64, otherwise use as is
    let cardUid: string;
    try {
      cardUid = Buffer.from(encodedCardUid, 'base64').toString('utf-8');
      // Check if it looks valid (not gibberish)
      if (cardUid.length > 0 && cardUid.length < 50 && !cardUid.includes('\ufffd')) {
        console.log('Decoded cardUid:', cardUid);
      } else {
        // Not valid base64, use as plain
        cardUid = encodedCardUid;
        console.log('Using plain cardUid:', cardUid);
      }
    } catch {
      // Not base64, use as plain
      cardUid = encodedCardUid;
      console.log('Using plain cardUid:', cardUid);
    }

    // Terminal already validated by guard
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: { gym: true },
    });
    if (!terminal) throw new Error('Terminal not found');
    const gymId = terminal.gymId;
    console.log('Terminal gymId:', gymId);

    // Check cooldown (implement Redis later)
    // For now, skip cooldown check

    // Check if card is operational
    const operationalCard = await this.prisma.card.findUnique({
      where: { uid: cardUid },
      include: { member: true },
    });
    console.log('Operational card found:', !!operationalCard, operationalCard?.gymId === gymId ? 'same gym' : 'different gym');

    if (operationalCard && operationalCard.gymId === gymId && operationalCard.active && operationalCard.member) {
      console.log('Card is active, checking subscription for member:', operationalCard.memberId);
      // Get the latest subscription (regardless of status) to check expiry
      const subscription = await this.prisma.gymMemberSubscription.findFirst({
        where: {
          memberId: operationalCard.memberId!,
        },
        orderBy: { endDate: 'desc' },
      });

      if (subscription && subscription.status === 'ACTIVE' && new Date(subscription.endDate) >= new Date()) {
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
    } else if (operationalCard && operationalCard.gymId === gymId && !operationalCard.active) {
      console.log('Card exists but disabled');
      // Card exists but is disabled
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_DISABLED',
        cardUid,
        memberId: operationalCard.memberId!,
      });
      return { result: 'DENY_DISABLED' };
    }

    console.log('Card not found or not operational, checking pending');
    // Not operational - check pending assignment

    // Not operational - check pending assignment
    const pending = await this.prisma.pendingMemberAssignment.findUnique({
      where: { gymId },
      include: { member: true },
    });

    if (!pending) {
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_UNKNOWN',
        cardUid,
      });
      return { result: 'DENY_UNKNOWN' };
    }

    // Check if expired
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
    const available = await this.cardAssignmentService.checkInventoryAvailability(gymId, cardUid);
    if (!available) {
      await this.eventsService.logEvent({
        gymId,
        terminalId,
        type: 'ACCESS_DENY_UNKNOWN',
        cardUid,
        memberId: pending.memberId,
      });
      return { result: 'DENY_UNKNOWN' };
    }

    // Assign card
    await this.cardAssignmentService.assignCard(gymId, pending.memberId, cardUid, pending.purpose);

    // Get subscription for expiry
    const subscription = await this.prisma.gymMemberSubscription.findFirst({
      where: {
        memberId: pending.memberId,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });

    await this.eventsService.logEvent({
      gymId,
      terminalId,
      type: 'CARD_ASSIGNED',
      cardUid,
      memberId: pending.memberId,
    });

    return {
      result: 'ASSIGNED',
      memberName: `${pending.member.firstName} ${pending.member.lastName}`,
      expiresAt: subscription?.endDate?.toISOString(),
    };
  }
}
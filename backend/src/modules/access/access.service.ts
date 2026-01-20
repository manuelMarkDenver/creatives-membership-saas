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

  async checkAccess(terminalId: string, terminalSecret: string, cardUid: string) {
    // Authenticate terminal
    const terminal = await this.terminalsService.validateTerminal(terminalId, terminalSecret);
    const gymId = terminal.gymId;

    // Check cooldown (implement Redis later)
    // For now, skip cooldown check

    // Check if card is operational
    const operationalCard = await this.prisma.card.findUnique({
      where: { uid: cardUid },
      include: {
        member: true,
      },
    });

    if (operationalCard && operationalCard.gymId === gymId && operationalCard.active && operationalCard.member) {
      // Get active subscription
      const subscription = await this.prisma.gymMemberSubscription.findFirst({
        where: {
          memberId: operationalCard.memberId!,
          status: 'ACTIVE',
        },
        orderBy: { endDate: 'desc' },
      });

      if (subscription && new Date(subscription.endDate) >= new Date()) {
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
        return { result: 'DENY_EXPIRED' };
      }
    } else if (operationalCard && operationalCard.gymId === gymId && !operationalCard.active) {
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
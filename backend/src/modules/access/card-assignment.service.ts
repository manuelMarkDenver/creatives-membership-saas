import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CardAssignmentService {
  constructor(private prisma: PrismaService) {}

  async assignCard(
    gymId: string,
    memberId: string,
    cardUid: string,
    purpose: 'ONBOARD' | 'REPLACE',
    oldCardUid?: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Check inventory availability
      const inventoryCard = await tx.inventoryCard.findUnique({
        where: { uid: cardUid },
      });

      if (
        !inventoryCard ||
        inventoryCard.status !== 'AVAILABLE' ||
        inventoryCard.allocatedGymId !== gymId
      ) {
        throw new Error('Card not available for assignment');
      }

      // Check for existing pending assignment
      const existingPending = await tx.pendingMemberAssignment.findUnique({
        where: { gymId },
      });

      if (existingPending) {
        await tx.pendingMemberAssignment.delete({
          where: { gymId },
        });
      }

      // For REPLACE, deactivate old card
      let deactivatedOldCardUid: string | undefined;
      if (purpose === 'REPLACE') {
        if (!oldCardUid) {
          throw new Error('Old card UID required for REPLACE purpose');
        }

        // Check if the old card exists and belongs to this member
        const oldCard = await tx.card.findUnique({
          where: { uid: oldCardUid },
        });

        if (
          !oldCard ||
          oldCard.memberId !== memberId ||
          oldCard.gymId !== gymId ||
          !oldCard.active
        ) {
          throw new Error('Invalid old card for replacement');
        }

        // Deactivate the old operational card
        await tx.card.update({
          where: { uid: oldCardUid },
          data: { active: false },
        });

        // Mark the old inventory card as DISABLED since it's no longer usable
        await tx.inventoryCard.update({
          where: { uid: oldCardUid },
          data: { status: 'DISABLED' },
        });

        deactivatedOldCardUid = oldCardUid;
      }

      // Create operational card
      await tx.card.create({
        data: {
          uid: cardUid,
          gymId,
          memberId,
          type: 'MONTHLY',
          active: true,
        },
      });

      // Update inventory
      await tx.inventoryCard.update({
        where: { uid: cardUid },
        data: { status: 'ASSIGNED' },
      });

      // Update member profile
      await tx.gymMemberProfile.update({
        where: { userId: memberId },
        data: {
          cardStatus: 'ACTIVE',
          cardUid,
          cardAssignedAt: new Date(),
        },
      });

      return { cardUid, memberId, oldCardUid: deactivatedOldCardUid };
    });
  }

  async checkInventoryAvailability(
    gymId: string,
    cardUid: string,
  ): Promise<boolean> {
    const card = await this.prisma.inventoryCard.findUnique({
      where: { uid: cardUid },
    });

    // Check if this is a DAILY card by looking at operational card type
    const operationalCard = await this.prisma.card.findUnique({
      where: { uid: cardUid },
    });
    
    if (operationalCard?.type === 'DAILY') {
      return false;
    }

    // DAILY cards are not available for assignment - they're for walk-ins only
    return card?.status === 'AVAILABLE' && card.allocatedGymId === gymId;
  }
}

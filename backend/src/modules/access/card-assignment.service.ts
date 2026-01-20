import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CardAssignmentService {
  constructor(private prisma: PrismaService) {}

  async assignCard(gymId: string, memberId: string, cardUid: string, purpose: 'ONBOARD' | 'REPLACE') {
    return this.prisma.$transaction(async (tx) => {
      // Check inventory availability
      const inventoryCard = await tx.inventoryCard.findUnique({
        where: { uid: cardUid },
      });

      if (!inventoryCard || inventoryCard.status !== 'AVAILABLE' || inventoryCard.allocatedGymId !== gymId) {
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

      return { cardUid, memberId };
    });
  }

  async checkInventoryAvailability(gymId: string, cardUid: string): Promise<boolean> {
    const card = await this.prisma.inventoryCard.findUnique({
      where: { uid: cardUid },
    });

    return card?.status === 'AVAILABLE' && card.allocatedGymId === gymId;
  }
}
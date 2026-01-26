const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSuperAdminCard() {
  try {
    // Find the existing SUPER_ADMIN card
    const superAdminCard = await prisma.card.findFirst({
      where: { type: 'SUPER_ADMIN' },
      include: { gym: true }
    });

    if (!superAdminCard) {
      console.error('No SUPER_ADMIN card found');
      return;
    }

    console.log(`Current SUPER_ADMIN card: ${superAdminCard.uid}`);
    console.log(`Branch: ${superAdminCard.gym.name}`);
    
    // Update to use a real UID - using 0000000001 as SUPER_ADMIN
    const realSuperAdminUid = '0000000001';
    
    // Check if new UID already exists
    const existingCardWithNewUid = await prisma.card.findUnique({
      where: { uid: realSuperAdminUid }
    });

    if (existingCardWithNewUid) {
      console.log(`Card ${realSuperAdminUid} already exists, updating to SUPER_ADMIN`);
      await prisma.card.update({
        where: { uid: realSuperAdminUid },
        data: { type: 'SUPER_ADMIN', active: true }
      });
      
      // Delete the old SUPER_ADMIN card
      await prisma.card.delete({
        where: { uid: superAdminCard.uid }
      });
      console.log(`Deleted old SUPER_ADMIN card: ${superAdminCard.uid}`);
    } else {
      // Update existing card to new UID
      await prisma.card.update({
        where: { uid: superAdminCard.uid },
        data: { uid: realSuperAdminUid }
      });
      console.log(`Updated SUPER_ADMIN card UID to: ${realSuperAdminUid}`);
    }

    // Update inventory card
    const existingInventory = await prisma.inventoryCard.findUnique({
      where: { uid: realSuperAdminUid }
    });

    if (existingInventory) {
      await prisma.inventoryCard.update({
        where: { uid: realSuperAdminUid },
        data: { status: 'ASSIGNED' }
      });
    } else {
      // Create new inventory entry
      await prisma.inventoryCard.create({
        data: {
          uid: realSuperAdminUid,
          allocatedGymId: superAdminCard.gymId,
          status: 'ASSIGNED'
        }
      });
      // Delete old inventory entry
      await prisma.inventoryCard.deleteMany({
        where: { uid: superAdminCard.uid }
      });
    }

    console.log('\n✅ SUPER_ADMIN card updated successfully!');
    console.log(`Card UID: ${realSuperAdminUid}`);
    console.log(`Type: SUPER_ADMIN`);
    console.log(`Branch: ${superAdminCard.gym.name}`);
    console.log('\nTo use: Tap card with UID 0000000001 on kiosk');
    console.log('The kiosk will enter admin mode for 5 minutes');

  } catch (error) {
    console.error('Error updating SUPER_ADMIN card:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdminCard();

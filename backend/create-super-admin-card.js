const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperAdminCard() {
  try {
    // First, find a gym/branch to assign the card to
    const branch = await prisma.branch.findFirst({
      where: { isActive: true },
      include: { tenant: true }
    });

    if (!branch) {
      console.error('No active branch found');
      return;
    }

    console.log(`Using branch: ${branch.name} (${branch.id})`);
    console.log(`Tenant: ${branch.tenant.name} (${branch.tenantId})`);

    // Create SUPER_ADMIN card (UID: 9999999999)
    const superAdminCardUid = '9999999999';
    
    // Check if card already exists
    const existingCard = await prisma.card.findUnique({
      where: { uid: superAdminCardUid }
    });

    if (existingCard) {
      console.log(`SUPER_ADMIN card ${superAdminCardUid} already exists`);
      // Update it to SUPER_ADMIN type
      await prisma.card.update({
        where: { uid: superAdminCardUid },
        data: { type: 'SUPER_ADMIN', active: true }
      });
      console.log('Updated card to SUPER_ADMIN type');
    } else {
      // Create new SUPER_ADMIN card
      await prisma.card.create({
        data: {
          uid: superAdminCardUid,
          gymId: branch.id,
          type: 'SUPER_ADMIN',
          active: true
        }
      });
      console.log(`Created SUPER_ADMIN card: ${superAdminCardUid}`);
    }

    // Also create inventory card entry
    const existingInventory = await prisma.inventoryCard.findUnique({
      where: { uid: superAdminCardUid }
    });

    if (!existingInventory) {
      await prisma.inventoryCard.create({
        data: {
          uid: superAdminCardUid,
          allocatedGymId: branch.id,
          status: 'ASSIGNED'
        }
      });
      console.log(`Created inventory card entry for ${superAdminCardUid}`);
    }

    console.log('\n✅ SUPER_ADMIN card created successfully!');
    console.log(`Card UID: ${superAdminCardUid}`);
    console.log(`Type: SUPER_ADMIN`);
    console.log(`Branch: ${branch.name}`);
    console.log('\nTo use: Tap card with UID 9999999999 on kiosk');
    console.log('The kiosk will enter admin mode for 5 minutes');

  } catch (error) {
    console.error('Error creating SUPER_ADMIN card:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdminCard();

// Test script for Phase 2 - Access Control System
// Run with: node test-access.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('Creating test data for Access Control System...');

  // Get existing gym
  const gym = await prisma.branch.findFirst({
    where: { name: { contains: 'Manggahan' } },
  });

  if (!gym) {
    console.error('Gym not found');
    return;
  }

  console.log(`Using gym: ${gym.name} (${gym.id})`);

  // Create terminal
  const terminalSecret = 'test-secret-123';
  const hashedSecret = await bcrypt.hash(terminalSecret, 12);

  const terminal = await prisma.terminal.upsert({
    where: { id: 'test-terminal-1' },
    update: {},
    create: {
      id: 'test-terminal-1',
      gymId: gym.id,
      tenantId: gym.tenantId,
      name: 'Test Terminal',
      secretHash: hashedSecret,
      isActive: true,
    },
  });

  console.log(`Created terminal: ${terminal.id}`);

  // Create inventory cards
  const inventoryCards = [];
  for (let i = 1; i <= 5; i++) {
    const uid = `TEST-CARD-${i.toString().padStart(3, '0')}`;
    const card = await prisma.inventoryCard.upsert({
      where: { uid },
      update: {},
      create: {
        uid,
        status: 'AVAILABLE',
        allocatedGymId: gym.id,
        batchId: 'TEST-BATCH-1',
      },
    });
    inventoryCards.push(card);
    console.log(`Created inventory card: ${card.uid}`);
  }

  // Create a pending assignment
  const member = await prisma.user.findFirst({
    where: { email: 'maria.santos@muscle-mania.com' },
  });

  if (member) {
    const pending = await prisma.pendingMemberAssignment.upsert({
      where: { gymId: gym.id },
      update: { expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      create: {
        gymId: gym.id,
        memberId: member.id,
        purpose: 'ONBOARD',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
    console.log(`Created pending assignment for member: ${member.firstName} ${member.lastName}`);
  }

  // Create card for expired member
  const expiredMember = await prisma.user.findFirst({
    where: { email: 'amy.taylor@muscle-mania.com' },
  });

  if (expiredMember) {
    await prisma.card.upsert({
      where: { uid: 'EXPIRED-CARD-001' },
      update: {},
      create: {
        uid: 'EXPIRED-CARD-001',
        gymId: gym.id,
        memberId: expiredMember.id,
        type: 'MONTHLY',
        active: true,
      },
    });
    console.log(`Created expired card for member: ${expiredMember.firstName} ${expiredMember.lastName}`);
  }

  // Create disabled card
  const disabledMember = await prisma.user.findFirst({
    where: { email: 'john.delacruz@muscle-mania.com' },
  });

  if (disabledMember) {
    await prisma.card.upsert({
      where: { uid: 'DISABLED-CARD-001' },
      update: {},
      create: {
        uid: 'DISABLED-CARD-001',
        gymId: gym.id,
        memberId: disabledMember.id,
        type: 'MONTHLY',
        active: false, // Disabled
      },
    });
    console.log(`Created disabled card for member: ${disabledMember.firstName} ${disabledMember.lastName}`);
  }

  // For expired pending test, we can modify existing pending later if needed
  console.log('Note: Only one pending per gym allowed. Use existing Maria Santos pending for tests.');

  console.log('\nTest data created successfully!');
  console.log(`Terminal ID: ${terminal.id}`);
  console.log(`Terminal Secret: ${terminalSecret}`);
  console.log(`Gym ID: ${gym.id}`);
  console.log(`Available Cards: ${inventoryCards.map(c => c.uid).join(', ')}`);
  console.log(`Expired Card: EXPIRED-CARD-001`);
}

createTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
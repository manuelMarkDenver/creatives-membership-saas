const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBranchData() {
  try {
    console.log('🔍 Checking CustomerSubscription branchId column...');

    // Check if any subscriptions have branchId
    const subscriptionsWithBranch = await prisma.customerSubscription.findMany({
      where: { branchId: { not: null } },
      take: 5,
      select: {
        id: true,
        branchId: true,
        customer: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } }
      }
    });

    const subscriptionsWithoutBranch = await prisma.customerSubscription.count({
      where: { branchId: null }
    });

    console.log('📊 Results:');
    console.log(`   - Subscriptions WITH branchId: ${subscriptionsWithBranch.length}`);
    console.log(`   - Subscriptions WITHOUT branchId: ${subscriptionsWithoutBranch}`);

    if (subscriptionsWithBranch.length > 0) {
      console.log('\n✅ Sample subscriptions with branch data:');
      subscriptionsWithBranch.forEach(sub => {
        console.log(`   - ${sub.customer.firstName} ${sub.customer.lastName} -> ${sub.branch?.name || 'Unknown branch'}`);
      });
    } else {
      console.log('\n❌ No subscriptions have branchId assigned!');
      console.log('Running branch assignment again...');
      
      // Re-run the assignment
      const { seedBranchAssignments } = require('./seed-branch-assignments.js');
      await seedBranchAssignments();
    }

  } catch (error) {
    console.error('❌ Error checking branch data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBranchData();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSubscriptions() {
  try {
    console.log('=== Testing Database Content ===');
    
    // Check total subscriptions
    const totalSubs = await prisma.customerSubscription.count();
    console.log(`Total CustomerSubscriptions: ${totalSubs}`);
    
    // Check subscriptions by status
    const activeSubs = await prisma.customerSubscription.count({ where: { status: 'ACTIVE' } });
    const expiredSubs = await prisma.customerSubscription.count({ where: { status: 'EXPIRED' } });
    console.log(`Active: ${activeSubs}, Expired: ${expiredSubs}`);
    
    // Get a few subscription examples
    const sampleSubs = await prisma.customerSubscription.findMany({
      take: 3,
      include: {
        customer: { select: { name: true, email: true } },
        membershipPlan: { select: { name: true, price: true } }
      }
    });
    
    console.log('\n=== Sample Subscriptions ===');
    sampleSubs.forEach(sub => {
      console.log(`${sub.customer.name} (${sub.customer.email}): ${sub.membershipPlan.name} - ${sub.status}`);
    });
    
    // Check transactions
    const totalTransactions = await prisma.customerTransaction.count();
    console.log(`\nTotal CustomerTransactions: ${totalTransactions}`);
    
    // Get sample transactions
    const sampleTransactions = await prisma.customerTransaction.findMany({
      take: 3,
      include: {
        customer: { select: { name: true, email: true } }
      }
    });
    
    console.log('\n=== Sample Transactions ===');
    sampleTransactions.forEach(txn => {
      console.log(`${txn.customer.name}: ${txn.description} - ₱${txn.amount}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptions();

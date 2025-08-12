const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://creatives_user:creatives_password@localhost:5433/creatives_db"
    }
  }
});

async function testExpiringMembersFix() {
  try {
    console.log('🔍 Testing Expiring Members Fix...\n');
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7); // 7 days window
    
    console.log(`Target Date: ${targetDate.toISOString()}\n`);
    
    // Test 1: Get all matching subscriptions (old method)
    console.log('📊 OLD METHOD (Direct Count):');
    const oldMethodCount = await prisma.customerSubscription.count({
      where: {
        status: 'ACTIVE',
        cancelledAt: null,
        endDate: { lte: targetDate },
        customer: {
          deletedAt: null,
          isActive: true
        }
      }
    });
    console.log(`Total subscriptions matching criteria: ${oldMethodCount}`);
    
    // Test 2: Get unique customers (new method)
    console.log('\n📊 NEW METHOD (Unique Customers Only):');
    const matchingSubscriptions = await prisma.customerSubscription.findMany({
      where: {
        status: 'ACTIVE',
        cancelledAt: null,
        endDate: { lte: targetDate },
        customer: {
          deletedAt: null,
          isActive: true
        }
      },
      select: {
        customerId: true,
        endDate: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group by customer and get only the most recent subscription per customer
    const customerLatestSubscriptions = new Map();
    matchingSubscriptions.forEach(sub => {
      const existing = customerLatestSubscriptions.get(sub.customerId);
      if (!existing || sub.createdAt > existing.createdAt) {
        customerLatestSubscriptions.set(sub.customerId, sub);
      }
    });
    
    const uniqueCustomersCount = customerLatestSubscriptions.size;
    console.log(`Unique customers with latest subscriptions: ${uniqueCustomersCount}`);
    
    console.log('\n📋 Subscription Details:');
    matchingSubscriptions.forEach((sub, index) => {
      const isLatest = customerLatestSubscriptions.get(sub.customerId) === sub;
      console.log(`${index + 1}. ${sub.customer.firstName} ${sub.customer.lastName} (${sub.customer.email})`);
      console.log(`   - Created: ${sub.createdAt.toISOString()}`);
      console.log(`   - End Date: ${sub.endDate.toISOString()}`);
      console.log(`   - Is Latest: ${isLatest ? '✅' : '❌'}`);
    });
    
    console.log('\n📋 Unique Customers (Latest Subscriptions Only):');
    Array.from(customerLatestSubscriptions.values()).forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.customer.firstName} ${sub.customer.lastName} (${sub.customer.email})`);
      console.log(`   - Created: ${sub.createdAt.toISOString()}`);
      console.log(`   - End Date: ${sub.endDate.toISOString()}`);
    });
    
    console.log(`\n🎯 RESULT:`);
    console.log(`Old Method Count: ${oldMethodCount}`);
    console.log(`New Method Count: ${uniqueCustomersCount}`);
    console.log(`Difference: ${oldMethodCount - uniqueCustomersCount}`);
    
    if (oldMethodCount !== uniqueCustomersCount) {
      console.log('\n✅ Fix is working! Duplicate subscriptions per customer are now filtered out.');
    } else {
      console.log('\n⚠️ No duplicates found, or fix needs verification.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExpiringMembersFix();

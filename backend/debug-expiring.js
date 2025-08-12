const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const tenantId = 'ca4990fb-2456-4e85-a05d-a6b11a7e3e2c'; // Muscle Mania tenant ID
    const daysBefore = 7;
    
    console.log('=== DEBUGGING EXPIRING MEMBERS DISCREPANCY ===\n');
    
    // 1. First, let's see what the backend query finds
    const currentDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    
    console.log(`Current Date: ${currentDate.toISOString()}`);
    console.log(`Target Date (${daysBefore} days ahead): ${targetDate.toISOString()}\n`);
    
    // Backend query (without user context - shows all)
    const backendWhereClause = {
      tenantId,
      status: 'ACTIVE',
      cancelledAt: null,
      endDate: {
        gt: currentDate,
        lte: targetDate
      },
      customer: {
        deletedAt: null,
        isActive: true
      }
    };
    
    console.log('Backend WHERE clause:');
    console.log(JSON.stringify(backendWhereClause, null, 2));
    console.log('\n');
    
    const backendResults = await prisma.customerSubscription.findMany({
      where: backendWhereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            deletedAt: true
          }
        },
        membershipPlan: {
          select: {
            name: true
          }
        }
      },
      orderBy: { endDate: 'asc' }
    });
    
    console.log(`BACKEND QUERY RESULTS: Found ${backendResults.length} subscriptions`);
    backendResults.forEach((sub, idx) => {
      const daysUntilExpiry = Math.ceil((new Date(sub.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  ${idx + 1}. ${sub.customer.email}`);
      console.log(`     - Plan: ${sub.membershipPlan.name}`);
      console.log(`     - End Date: ${sub.endDate}`);
      console.log(`     - Days Until Expiry: ${daysUntilExpiry}`);
      console.log(`     - Status: ${sub.status}, Cancelled: ${sub.cancelledAt}`);
      console.log(`     - Customer Active: ${sub.customer.isActive}, Deleted: ${sub.customer.deletedAt}`);
      console.log('');
    });
    
    // 2. Now let's see what the frontend gets (all members with their subscriptions)
    console.log('\n=== FRONTEND DATA (ALL MEMBERS) ===\n');
    
    const allMembers = await prisma.user.findMany({
      where: {
        tenantId,
        role: 'GYM_MEMBER'
      },
      include: {
        customerSubscriptions: {
          include: {
            membershipPlan: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                type: true
              }
            },
            branch: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`FRONTEND DATA: Found ${allMembers.length} total members`);
    
    // Apply frontend logic to each member
    const frontendExpiringMembers = [];
    
    allMembers.forEach((member) => {
      const subscription = member.customerSubscriptions?.[0];
      
      console.log(`\n--- ${member.email} ---`);
      console.log(`  Member Active: ${member.isActive}, Deleted: ${member.deletedAt}`);
      
      if (!subscription) {
        console.log(`  ❌ No subscription`);
        return;
      }
      
      console.log(`  Subscription Status: ${subscription.status}, Cancelled: ${subscription.cancelledAt}`);
      console.log(`  End Date: ${subscription.endDate}`);
      
      // Apply frontend logic
      if (!member.isActive || member.deletedAt) {
        console.log(`  ❌ Member not active or deleted`);
        return;
      }
      
      if (!subscription || subscription.status !== 'ACTIVE' || subscription.cancelledAt) {
        console.log(`  ❌ Subscription not active or cancelled`);
        return;
      }
      
      const currentDateNormalized = new Date();
      currentDateNormalized.setHours(0, 0, 0, 0);
      
      const targetDateNormalized = new Date(currentDateNormalized);
      targetDateNormalized.setDate(targetDateNormalized.getDate() + daysBefore);
      
      const endDate = new Date(subscription.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpiry = Math.ceil((endDate.getTime() - currentDateNormalized.getTime()) / (1000 * 60 * 60 * 24 * 1000));
      console.log(`  Days Until Expiry: ${daysUntilExpiry}`);
      console.log(`  End Date > Current: ${endDate > currentDateNormalized}`);
      console.log(`  End Date <= Target: ${endDate <= targetDateNormalized}`);
      
      if (endDate > currentDateNormalized && endDate <= targetDateNormalized) {
        console.log(`  ✅ FRONTEND: Member is expiring!`);
        frontendExpiringMembers.push(member);
      } else {
        console.log(`  ❌ FRONTEND: Member not expiring`);
      }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Backend count: ${backendResults.length}`);
    console.log(`Frontend count: ${frontendExpiringMembers.length}`);
    console.log(`\nFrontend expiring members:`);
    frontendExpiringMembers.forEach((member, idx) => {
      console.log(`  ${idx + 1}. ${member.email}`);
    });
    
    // 3. Let's also check if there are any subscriptions that match backend criteria but don't have corresponding users
    console.log(`\n=== POTENTIAL ISSUES ===`);
    
    const backendEmails = backendResults.map(sub => sub.customer.email);
    const frontendEmails = frontendExpiringMembers.map(member => member.email);
    
    const onlyInBackend = backendEmails.filter(email => !frontendEmails.includes(email));
    const onlyInFrontend = frontendEmails.filter(email => !backendEmails.includes(email));
    
    console.log(`Members only in backend: ${onlyInBackend.length}`);
    onlyInBackend.forEach(email => console.log(`  - ${email}`));
    
    console.log(`Members only in frontend: ${onlyInFrontend.length}`);
    onlyInFrontend.forEach(email => console.log(`  - ${email}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

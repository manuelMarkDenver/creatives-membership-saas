const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAmyTaylor() {
  try {
    console.log('🔍 Debugging Amy Taylor\'s subscription status...\n');

    // Find Amy Taylor
    const amy = await prisma.user.findFirst({
      where: {
        firstName: 'Amy',
        lastName: 'Taylor'
      },
      include: {
        gymMemberSubscriptions: {
          include: {
            membershipPlan: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!amy) {
      console.log('❌ Amy Taylor not found in database');
      return;
    }

    console.log('👤 Found Amy Taylor:');
    console.log(`   ID: ${amy.id}`);
    console.log(`   Name: ${amy.firstName} ${amy.lastName}`);
    console.log(`   Email: ${amy.email}`);
    console.log(`   Deleted: ${amy.deletedAt ? 'Yes' : 'No'}`);
    console.log('');

    console.log('💳 Subscriptions:');
    if (amy.gymMemberSubscriptions.length === 0) {
      console.log('   No subscriptions found');
    } else {
      amy.gymMemberSubscriptions.forEach((sub, index) => {
        console.log(`   Subscription ${index + 1}:`);
        console.log(`     ID: ${sub.id}`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Plan: ${sub.membershipPlan.name}`);
        console.log(`     Start: ${sub.startDate}`);
        console.log(`     End: ${sub.endDate}`);
        console.log(`     Cancelled: ${sub.cancelledAt || 'No'}`);
        console.log(`     Created: ${sub.createdAt}`);
        console.log('');
      });
    }

    // Replicate the backend getMemberState logic
    function getMemberState(member) {
      // Check if deleted (has deletedAt timestamp)
      if (member.deletedAt) {
        return 'DELETED';
      }

      // Check subscription status
      const activeSubscription = member.gymMemberSubscriptions?.[0];
      if (!activeSubscription) {
        // No subscription - member has no active membership
        return 'NO_SUBSCRIPTION';
      }

      // Check if subscription is cancelled
      if (activeSubscription.status === 'CANCELLED') {
        return 'CANCELLED';
      }

      // Check if subscription is expired
      const now = new Date();
      const endDate = new Date(activeSubscription.endDate);
      if (endDate < now || activeSubscription.status === 'EXPIRED') {
        return 'EXPIRED';
      }

      // Member has active subscription
      return 'ACTIVE';
    }

    const memberState = getMemberState(amy);
    console.log(`🎯 Backend member state logic result: ${memberState}`);

    // Check what the frontend should see
    console.log('\n📱 Frontend data that would be returned:');
    const frontendData = {
      id: amy.id,
      firstName: amy.firstName,
      lastName: amy.lastName,
      email: amy.email,
      deletedAt: amy.deletedAt,
      gymSubscriptions: amy.gymMemberSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        cancelledAt: sub.cancelledAt,
        branchId: sub.branchId,
        createdAt: sub.createdAt,
        membershipPlan: {
          id: sub.membershipPlan.id,
          name: sub.membershipPlan.name,
          price: sub.membershipPlan.price,
          duration: sub.membershipPlan.duration,
          type: sub.membershipPlan.type
        }
      }))
    };

    console.log(JSON.stringify(frontendData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAmyTaylor();
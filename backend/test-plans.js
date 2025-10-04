const { PrismaClient } = require('@prisma/client');

async function testMembershipPlans() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing membership plans for tenant with no plans...');
    
    const tenantId = '0dcfe271-bc3f-44e1-8e70-e4ea9199ba60'; // mozif tenant
    const includeDeleted = false;
    
    const whereClause = includeDeleted
      ? { tenantId }
      : { tenantId, deletedAt: null };

    console.log('Fetching plans...');
    const plans = await prisma.gymMembershipPlan.findMany({
      where: whereClause,
      orderBy: [
        { deletedAt: 'asc' }, 
        { isActive: 'desc' }, 
        { createdAt: 'desc' }
      ],
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        deletedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    console.log(`Found ${plans.length} plans`);
    
    // Get member counts for each plan
    const memberCountMap = new Map();
    
    // For each plan, count active subscriptions
    for (const plan of plans) {
      const memberCount = await prisma.gymMemberSubscription.count({
        where: {
          gymMembershipPlanId: plan.id,
          tenantId,
          status: 'ACTIVE',
          cancelledAt: null,
        },
      });
      memberCountMap.set(plan.id, memberCount);
      console.log(`Plan ${plan.id}: ${memberCount} members`);
    }
    
    const result = {
      success: true,
      data: plans.map((plan) => {
        // Safely parse benefits field
        let benefits = [];
        try {
          if (plan.benefits) {
            if (typeof plan.benefits === 'string') {
              benefits = JSON.parse(plan.benefits);
            } else {
              benefits = plan.benefits;
            }
          }
        } catch (error) {
          console.warn(`Failed to parse benefits for plan ${plan.id}: ${error.message}`);
          benefits = [];
        }
        
        return {
          ...plan,
          benefits,
          memberCount: memberCountMap.get(plan.id) || 0,
          isDeleted: !!plan.deletedAt,
        };
      }),
    };
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMembershipPlans();
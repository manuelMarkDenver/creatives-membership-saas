const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking membership plans for Barbara Hyde tenant...');
    
    // Get Barbara's tenant ID
    const user = await prisma.user.findFirst({
      where: { 
        firstName: 'Barbara',
        lastName: 'Hyde'
      }
    });
    
    if (user) {
      console.log('Barbara tenant ID:', user.tenantId);
      
      const plans = await prisma.gymMembershipPlan.findMany({
        where: { tenantId: user.tenantId }
      });
      
      console.log('Membership plans found:', plans.length);
      plans.forEach((plan, index) => {
        console.log(`  Plan ${index + 1}:`, {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          status: plan.status
        });
      });
    } else {
      console.log('Barbara not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

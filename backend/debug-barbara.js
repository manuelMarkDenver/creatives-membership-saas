const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Barbara Hyde member data...');
    
    const user = await prisma.user.findFirst({
      where: { 
        firstName: 'Barbara',
        lastName: 'Hyde'
      },
      include: {
        gymMemberProfile: true,
        gymMemberSubscriptions: {
          include: {
            gymMembershipPlan: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      });
      
      if (user.gymMemberProfile) {
        console.log('Gym Profile:', {
          id: user.gymMemberProfile.id,
          status: user.gymMemberProfile.status,
          primaryBranchId: user.gymMemberProfile.primaryBranchId,
          joinedDate: user.gymMemberProfile.joinedDate
        });
      } else {
        console.log('No gym member profile found!');
      }
      
      console.log('Subscriptions:', user.gymMemberSubscriptions.length);
      user.gymMemberSubscriptions.forEach((sub, index) => {
        console.log(`  Subscription ${index + 1}:`, {
          id: sub.id,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          planName: sub.gymMembershipPlan?.name,
          price: sub.price
        });
      });
      
    } else {
      console.log('Barbara Hyde not found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

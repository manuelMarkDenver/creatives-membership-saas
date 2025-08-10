const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying users by role...');
    
    // Look for different roles
    const roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF'];
    
    for (const role of roles) {
      const users = await prisma.user.findMany({
        where: { role },
        take: 1,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          userBranches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  isActive: true
                }
              }
            }
          }
        }
      });
      
      if (users.length > 0) {
        const user = users[0];
        const testToken = Buffer.from(JSON.stringify({
          userId: user.id,
          email: user.email
        })).toString('base64');
        
        console.log(`\n=== ${role} USER ===`);
        console.log('User:', {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
          branchAccess: user.userBranches.length
        });
        
        if (user.userBranches.length > 0) {
          console.log('Branch Access:', user.userBranches.map(ub => ({
            branchId: ub.branchId,
            branchName: ub.branch.name,
            accessLevel: ub.accessLevel,
            isPrimary: ub.isPrimary
          })));
        }
        
        console.log('Test token:');
        console.log('Bearer', testToken);
      } else {
        console.log(`\n=== ${role} USER ===`);
        console.log('No users found with this role');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

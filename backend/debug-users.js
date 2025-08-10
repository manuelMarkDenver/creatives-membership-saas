const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying users...');
    
    // Look for a super admin
    const superAdminUsers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      take: 1,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });
    
    if (superAdminUsers.length > 0) {
      const superAdmin = superAdminUsers[0];
      const testToken = Buffer.from(JSON.stringify({
        userId: superAdmin.id,
        email: superAdmin.email
      })).toString('base64');
      
      console.log('Found SUPER_ADMIN:', JSON.stringify(superAdmin, null, 2));
      console.log('\nTest token for SUPER_ADMIN:');
      console.log('Bearer', testToken);
      return;
    }
    
    // Fall back to any staff/manager
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STAFF', 'MANAGER', 'OWNER'] }
      },
      take: 3,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });
    
    console.log('Found users:', JSON.stringify(users, null, 2));
    
    if (users.length > 0) {
      // Create a test token for the first user
      const testUser = users[0];
      const testToken = Buffer.from(JSON.stringify({
        userId: testUser.id,
        email: testUser.email
      })).toString('base64');
      
      console.log('\nTest token for first user:');
      console.log('Bearer', testToken);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

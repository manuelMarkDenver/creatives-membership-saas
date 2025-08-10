const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserBranchAssignments() {
  console.log('🔍 Checking current user branch assignments...\n');

  try {
    // Get all user-branch assignments
    const assignments = await prisma.userBranch.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            tenant: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { user: { email: 'asc' } },
        { isPrimary: 'desc' }
      ]
    });

    if (assignments.length === 0) {
      console.log('❌ No branch assignments found!');
      console.log('This means staff and managers will see ALL branches, which is incorrect.\n');
      
      // Show all non-super-admin users
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['OWNER', 'MANAGER', 'STAFF'] }
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          tenant: {
            select: { name: true }
          }
        },
        orderBy: { email: 'asc' }
      });

      console.log('👥 Users without branch assignments:');
      users.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.tenant?.name || 'No Tenant'}`);
      });
    } else {
      console.log('✅ Found branch assignments:');
      
      const groupedByUser = assignments.reduce((acc, assignment) => {
        const userKey = assignment.user.email;
        if (!acc[userKey]) {
          acc[userKey] = {
            user: assignment.user,
            branches: []
          };
        }
        acc[userKey].branches.push({
          branch: assignment.branch,
          accessLevel: assignment.accessLevel,
          isPrimary: assignment.isPrimary
        });
        return acc;
      }, {});

      Object.values(groupedByUser).forEach(({ user, branches }) => {
        console.log(`\n${user.firstName} ${user.lastName} (${user.email}) - ${user.role}:`);
        branches.forEach(({ branch, accessLevel, isPrimary }) => {
          const primaryFlag = isPrimary ? ' [PRIMARY]' : '';
          console.log(`  └─ ${branch.tenant.name} > ${branch.name} (${accessLevel})${primaryFlag}`);
        });
      });

      // Show users without assignments
      const assignedUserIds = [...new Set(assignments.map(a => a.userId))];
      const unassignedUsers = await prisma.user.findMany({
        where: {
          role: { in: ['MANAGER', 'STAFF'] },
          id: { notIn: assignedUserIds }
        },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          tenant: { select: { name: true } }
        }
      });

      if (unassignedUsers.length > 0) {
        console.log('\n⚠️ Users without branch assignments (they will see ALL branches):');
        unassignedUsers.forEach(user => {
          console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.tenant?.name}`);
        });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Total assignments: ${assignments.length}`);
    console.log(`- Users with assignments: ${[...new Set(assignments.map(a => a.userId))].length}`);
    
    // Count by role
    const roleCount = assignments.reduce((acc, a) => {
      acc[a.user.role] = (acc[a.user.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`- ${role} assignments: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBranchAssignments();

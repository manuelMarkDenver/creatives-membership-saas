const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUserBranchAccess() {
  try {
    console.log('🌱 Starting user branch access seeding...');

    // Get all non-super-admin users with their tenants and current branch access
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'SUPER_ADMIN' },
        tenantId: { not: null }
      },
      include: {
        tenant: {
          include: {
            branches: {
              where: { isActive: true },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        userBranches: {
          include: { branch: true }
        }
      }
    });

    console.log(`Found ${users.length} users to process`);

    let totalAssignments = 0;

    for (const user of users) {
      if (!user.tenant || user.tenant.branches.length === 0) {
        console.log(`⚠️  User ${user.firstName} ${user.lastName} has no tenant or branches, skipping...`);
        continue;
      }

      const existingBranchAccess = user.userBranches;
      const availableBranches = user.tenant.branches;
      
      console.log(`📋 Processing ${user.role}: ${user.firstName} ${user.lastName}`);
      console.log(`   - Tenant: ${user.tenant.name}`);
      console.log(`   - Available branches: ${availableBranches.length}`);
      console.log(`   - Current branch access: ${existingBranchAccess.length}`);

      // Determine access level based on role
      let accessLevel;
      switch (user.role) {
        case 'OWNER':
          accessLevel = 'FULL_ACCESS';
          break;
        case 'MANAGER':
          accessLevel = 'MANAGER_ACCESS';
          break;
        case 'STAFF':
        case 'GYM_TRAINER':
        case 'GYM_NUTRITIONIST':
        case 'GYM_FRONT_DESK':
        case 'GYM_MAINTENANCE':
          accessLevel = 'STAFF_ACCESS';
          break;
        default:
          console.log(`   ⚠️  Unknown role ${user.role}, using STAFF_ACCESS`);
          accessLevel = 'STAFF_ACCESS';
      }

      // For OWNER and MANAGER roles, give access to all branches
      // For STAFF roles, give access to primary branch only (can be expanded later)
      let branchesToAssign = [];
      
      if (user.role === 'OWNER' || user.role === 'MANAGER') {
        // Owners and Managers get access to all branches
        branchesToAssign = availableBranches;
      } else {
        // Staff get access to primary branch (first branch)
        branchesToAssign = [availableBranches[0]];
      }

      console.log(`   - Access level: ${accessLevel}`);
      console.log(`   - Branches to assign: ${branchesToAssign.length}`);

      for (let i = 0; i < branchesToAssign.length; i++) {
        const branch = branchesToAssign[i];
        
        // Check if user already has access to this branch
        const existingAccess = existingBranchAccess.find(ub => ub.branchId === branch.id);
        
        if (existingAccess) {
          console.log(`   ✅ Already has access to ${branch.name}`);
          continue;
        }

        // Create branch access
        await prisma.userBranch.create({
          data: {
            userId: user.id,
            branchId: branch.id,
            accessLevel: accessLevel,
            isPrimary: i === 0, // First branch is primary
            permissions: {}
          }
        });

        totalAssignments++;
        console.log(`   ✅ Assigned ${accessLevel} access to ${branch.name}${i === 0 ? ' (PRIMARY)' : ''}`);
      }
    }

    console.log(`\n🎉 User branch access seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total branch assignments created: ${totalAssignments}`);
    console.log(`   - Users processed: ${users.length}`);

    // Summary by role - simplified version
    const userBranchCounts = await prisma.user.findMany({
      where: { role: { not: 'SUPER_ADMIN' } },
      select: {
        role: true,
        _count: {
          select: { userBranches: true }
        }
      }
    });

    console.log(`\n📊 Access Summary by Role:`);
    const roleStats = {};
    
    userBranchCounts.forEach(user => {
      if (!roleStats[user.role]) {
        roleStats[user.role] = { users: 0, totalAccess: 0, avgAccess: 0 };
      }
      roleStats[user.role].users++;
      roleStats[user.role].totalAccess += user._count.userBranches;
    });

    Object.keys(roleStats).forEach(role => {
      const stats = roleStats[role];
      stats.avgAccess = (stats.totalAccess / stats.users).toFixed(1);
      console.log(`   - ${role}: ${stats.users} users, avg ${stats.avgAccess} branches each`);
    });

  } catch (error) {
    console.error('❌ Error during user branch access seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  seedUserBranchAccess();
}

module.exports = { seedUserBranchAccess };

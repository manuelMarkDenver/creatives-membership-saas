const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBranchAssignments() {
  try {
    console.log('🌱 Starting branch assignment seeding...');

    // Get all tenants with their branches
    const tenantsWithBranches = await prisma.tenant.findMany({
      include: {
        branches: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' } // Get the first created branch as primary
        },
        customerSubscriptions: {
          where: { branchId: null }, // Only unassigned subscriptions
          select: { id: true }
        }
      }
    });

    console.log(`Found ${tenantsWithBranches.length} tenants to process`);

    let totalAssignments = 0;

    for (const tenant of tenantsWithBranches) {
      if (tenant.branches.length === 0) {
        console.log(`⚠️  Tenant ${tenant.name} has no active branches, skipping...`);
        continue;
      }

      const primaryBranch = tenant.branches[0]; // Use first branch as default
      const unassignedSubscriptions = tenant.customerSubscriptions;

      if (unassignedSubscriptions.length === 0) {
        console.log(`✅ Tenant ${tenant.name}: All subscriptions already assigned to branches`);
        continue;
      }

      console.log(`📋 Processing tenant ${tenant.name}:`);
      console.log(`   - Available branches: ${tenant.branches.length}`);
      console.log(`   - Unassigned subscriptions: ${unassignedSubscriptions.length}`);
      console.log(`   - Assigning to primary branch: ${primaryBranch.name}`);

      // Assign all unassigned subscriptions to the primary branch
      const updateResult = await prisma.customerSubscription.updateMany({
        where: {
          tenantId: tenant.id,
          branchId: null
        },
        data: {
          branchId: primaryBranch.id
        }
      });

      totalAssignments += updateResult.count;
      console.log(`   ✅ Assigned ${updateResult.count} subscriptions to ${primaryBranch.name}`);
    }

    console.log(`\n🎉 Branch assignment seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total subscriptions assigned: ${totalAssignments}`);
    console.log(`   - Tenants processed: ${tenantsWithBranches.length}`);

    // Verify assignments
    const unassignedCount = await prisma.customerSubscription.count({
      where: { branchId: null }
    });
    
    if (unassignedCount > 0) {
      console.log(`⚠️  Warning: ${unassignedCount} subscriptions still unassigned`);
    } else {
      console.log(`✅ All customer subscriptions are now assigned to branches!`);
    }

  } catch (error) {
    console.error('❌ Error during branch assignment seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  seedBranchAssignments();
}

module.exports = { seedBranchAssignments };

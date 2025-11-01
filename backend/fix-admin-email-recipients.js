const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminEmailRecipients() {
  try {
    console.log('🔍 Finding tenants with null or empty adminEmailRecipients...');

    // Find all tenants where adminEmailRecipients is null or empty
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { adminEmailRecipients: null },
          { adminEmailRecipients: { equals: [] } }
        ]
      },
      select: {
        id: true,
        name: true,
        adminEmailRecipients: true
      }
    });

    console.log(`Found ${tenants.length} tenants to fix:`);
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.id}): ${tenant.adminEmailRecipients}`);
    });

    for (const tenant of tenants) {
      // Find the owner of this tenant
      const owner = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          role: 'OWNER'
        },
        select: {
          email: true
        }
      });

      if (owner) {
        console.log(`Updating ${tenant.name} with owner's email: ${owner.email}`);

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            adminEmailRecipients: [owner.email.trim().toLowerCase()]
          }
        });

        console.log(`✅ Updated ${tenant.name}`);
      } else {
        console.log(`❌ No owner found for tenant ${tenant.name}`);
      }
    }

    console.log('🎉 Finished fixing adminEmailRecipients');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminEmailRecipients();
// Script to fix existing Google OAuth tenants
// Run with: node fix-google-oauth-tenants.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGoogleOAuthTenants() {
  try {
    console.log('Finding Google OAuth users...');

    // Find all Google OAuth users
    const googleUsers = await prisma.user.findMany({
      where: {
        authProvider: 'GOOGLE'
      },
      include: {
        tenant: true
      }
    });

    console.log(`Found ${googleUsers.length} Google OAuth users`);

    for (const user of googleUsers) {
      if (user.tenant) {
        console.log(`Updating tenant ${user.tenant.name} (${user.tenant.id}) for user ${user.email}`);

        // Update tenant to have correct flags for Google OAuth
        await prisma.tenant.update({
          where: { id: user.tenant.id },
          data: {
            ownerPasswordChanged: true, // Google OAuth users don't need password change
          }
        });

        // Update user to have password set
        await prisma.user.update({
          where: { id: user.id },
          data: {
            initialPasswordSet: true, // Google OAuth users don't set passwords
          }
        });

        console.log(`✓ Updated tenant and user for ${user.email}`);
      }
    }

    console.log('All Google OAuth tenants updated successfully!');
  } catch (error) {
    console.error('Error fixing Google OAuth tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleOAuthTenants();
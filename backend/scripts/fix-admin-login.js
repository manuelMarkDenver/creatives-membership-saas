const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdminLogin() {
  console.log('🔍 Checking super admin user...\n');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@creatives-saas.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

  try {
    // Find the super admin user
    const superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!superAdmin) {
      console.log('❌ Super admin not found. Creating one...\n');
      
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
      
      console.log('✅ Super admin created successfully!\n');
      console.log('Login credentials:');
      console.log(`   Email: ${newSuperAdmin.email}`);
      console.log(`   Password: ${superAdminPassword}`);
      console.log(`   Role: ${newSuperAdmin.role}\n`);
    } else {
      console.log('✅ Super admin found!\n');
      console.log('Current status:');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Role: ${superAdmin.role}`);
      console.log(`   Email Verified: ${superAdmin.emailVerified}`);
      console.log(`   Deleted: ${superAdmin.deletedAt ? 'Yes' : 'No'}`);
      console.log(`   Has Password: ${superAdmin.password ? 'Yes' : 'No'}\n`);

      let needsUpdate = false;
      const updates = {};

      // Check if email is not verified
      if (!superAdmin.emailVerified) {
        console.log('⚠️  Email is NOT verified. Fixing...');
        updates.emailVerified = true;
        updates.emailVerifiedAt = new Date();
        needsUpdate = true;
      }

      // Check if user is deleted
      if (superAdmin.deletedAt) {
        console.log('⚠️  User is deleted. Restoring...');
        updates.deletedAt = null;
        needsUpdate = true;
      }

      // Check if password exists
      if (!superAdmin.password) {
        console.log('⚠️  No password set. Setting default password...');
        updates.password = await bcrypt.hash(superAdminPassword, 12);
        needsUpdate = true;
      } else {
        // Verify if password is correct
        const isPasswordValid = await bcrypt.compare(superAdminPassword, superAdmin.password);
        if (!isPasswordValid) {
          console.log('⚠️  Password mismatch detected. Resetting to default...');
          updates.password = await bcrypt.hash(superAdminPassword, 12);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: superAdmin.id },
          data: updates,
        });
        console.log('\n✅ Super admin updated successfully!\n');
      } else {
        console.log('✅ Super admin is properly configured. No updates needed.\n');
      }

      console.log('Login credentials:');
      console.log(`   Email: ${superAdminEmail}`);
      console.log(`   Password: ${superAdminPassword}`);
      console.log(`   Role: SUPER_ADMIN\n`);
    }

    console.log('🎉 Done! You can now log in with the credentials above.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminLogin();

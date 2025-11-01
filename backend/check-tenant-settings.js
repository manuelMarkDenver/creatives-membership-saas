const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenantSettings() {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: '5dbcaa61-2b74-4c4b-89a0-7738d5ccd993' },
      select: {
        id: true,
        name: true,
        emailNotificationsEnabled: true,
        welcomeEmailEnabled: true,
        adminAlertEmailEnabled: true,
        tenantNotificationEmailEnabled: false,
        adminEmailRecipients: true,
      }
    });

    if (tenant) {
      console.log('Current Tenant Email Settings:');
      console.log(`- Master Email Enabled: ${tenant.emailNotificationsEnabled}`);
      console.log(`- Welcome Email Enabled: ${tenant.welcomeEmailEnabled}`);
      console.log(`- Admin Alert Enabled: ${tenant.adminAlertEmailEnabled}`);
      console.log(`- Tenant Notification Enabled: ${tenant.tenantNotificationEmailEnabled}`);
      console.log(`- Admin Recipients: ${tenant.adminEmailRecipients.join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantSettings();
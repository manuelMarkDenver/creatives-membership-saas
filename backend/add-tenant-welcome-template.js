// Script to add the tenant welcome email template
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTenantWelcomeTemplate() {
  try {
    console.log('Adding tenant welcome email template...');

    // Check if template already exists
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { templateType: 'tenant_welcome' }
    });

    if (existingTemplate) {
      console.log('✅ Tenant welcome email template already exists');
      return;
    }

    // Add the template
    await prisma.emailTemplate.create({
      data: {
        templateType: 'tenant_welcome',
        name: 'Tenant Onboarding Complete',
        tenantId: null, // Global template
        isActive: true,
        subject: 'Welcome to GymBossLab! Your account is ready 🎉',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 32px; margin: 0;">GymBossLab</h1>
            </div>

            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome to GymBossLab! 🎉</h2>

              <p>Hi <strong>{{ownerName}}</strong>,</p>

              <p>Congratulations! You've successfully set up <strong>{{tenantName}}</strong> and your account is now ready to use.</p>

              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin-top: 0; color: #1e40af;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Add Members:</strong> Start building your member database</li>
                  <li><strong>Manage Plans:</strong> Customize your membership plans</li>
                  <li><strong>Track Revenue:</strong> Monitor your business performance</li>
                  <li><strong>Configure Settings:</strong> Set up notifications and preferences</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #f97316 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Access Your Dashboard</a>
              </div>

              <p>If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
              <p>Questions? Reply to this email or visit our support center.</p>
              <p style="margin-top: 10px;">Best regards,<br><strong>The GymBossLab Team</strong></p>
            </div>
          </body>
          </html>
        `,
        textContent: `
Welcome to GymBossLab! 🎉

Hi {{ownerName}},

Congratulations! You've successfully set up {{tenantName}} and your account is now ready to use.

What's Next?
- Add Members: Start building your member database
- Manage Plans: Customize your membership plans
- Track Revenue: Monitor your business performance
- Configure Settings: Set up notifications and preferences

Access Your Dashboard: {{dashboardUrl}}

If you have any questions or need assistance, feel free to reply to this email or contact our support team.

Best regards,
The GymBossLab Team
        `,
        variables: {
          ownerName: 'Owner full name',
          tenantName: 'Gym/tenant name',
          dashboardUrl: 'URL to access the dashboard',
        },
      }
    });

    console.log('✅ Tenant welcome email template added successfully');
  } catch (error) {
    console.error('Error adding tenant welcome template:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTenantWelcomeTemplate();
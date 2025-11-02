const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper functions for generating realistic emergency contact data
function generateEmergencyContactName() {
  const firstNames = [
    'Maria', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Miguel',
    'Sofia', 'Diego', 'Isabella', 'Antonio', 'Gabriela', 'Luis', 'Carmen',
    'Fernando', 'Victoria', 'Roberto', 'Patricia', 'Manuel', 'Teresa',
    'Ricardo', 'Monica', 'Francisco', 'Laura', 'Alberto', 'Cristina',
    'Javier', 'Natalia', 'Rafael', 'Silvia', 'Enrique', 'Beatriz', 'Oscar',
    'Angela', 'Pablo', 'Dolores', 'Sergio', 'Pilar', 'Adrian', 'Gloria'
  ];

  const lastNames = [
    'Santos', 'Dela Cruz', 'Garcia', 'Rodriguez', 'Martinez', 'Lopez',
    'Hernandez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
    'Flores', 'Rivera', 'Gomez', 'Diaz', 'Morales', 'Ortiz', 'Gutierrez',
    'Chavez', 'Ramos', 'Hernandez', 'Jimenez', 'Ruiz', 'Fernandez', 'Moreno'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

function getRandomRelationship() {
  const relationships = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Aunt', 'Uncle',
    'Cousin', 'Friend', 'Neighbor', 'Colleague', 'Guardian', 'In-law'
  ];

  return relationships[Math.floor(Math.random() * relationships.length)];
}

async function seedEmailTemplates() {
  const templates = [
    {
      templateType: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{tenantName}}! 🎉',
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
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to {{tenantName}}! 🏋️</h2>

            <p>Hi <strong>{{memberName}}</strong>,</p>

            <p>Welcome to <strong>{{tenantName}}</strong>! We're excited to have you join our fitness community.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Your Membership Details:</h3>
              <p><strong>Membership Plan:</strong> {{membershipPlan}}</p>
              <p><strong>Status:</strong> Active</p>
              <p><strong>Registration Date:</strong> {{registrationDate}}</p>
              <p><strong>Start Date:</strong> {{startDate}}</p>
              <p><strong>End Date:</strong> {{endDate}}</p>
            </div>

             <p>We're excited to help you achieve your fitness goals! Our team will be in touch soon with more details about your membership.</p>

             <div style="text-align: center; margin: 30px 0;">
               <p style="color: #6b7280; font-size: 14px;">Questions? Feel free to reply to this email.</p>
             </div>

            <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
            <p>Questions? Reply to this email or visit our support center.</p>
            <p style="margin-top: 10px;">Best regards,<br><strong>The {{tenantName}} Team</strong></p>
          </div>
        </body>
        </html>
      `,
      textContent: `
Welcome to {{tenantName}}! 🏋️

Hi {{memberName}},

Welcome to {{tenantName}}! We're excited to have you join our fitness community.

Your Membership Details:
- Membership Plan: {{membershipPlan}}
- Status: Active

You can now access your member dashboard to view your membership details, track your progress, schedule appointments, and access exclusive member content.

Access Your Dashboard: {{loginUrl}}

If you have any questions, feel free to reply to this email or contact our support team.

Best regards,
The {{tenantName}} Team
      `,
      variables: {
        memberName: 'Member full name',
        tenantName: 'Gym/tenant name',
        membershipPlan: 'Membership plan name',
        registrationDate: 'Date of member registration',
        startDate: 'Membership start date',
        endDate: 'Membership end date',
        loginUrl: 'Login URL for member dashboard',
      },
    },
    {
      templateType: 'admin_alert',
      name: 'New Tenant Registration Alert',
      subject: 'New Tenant Registration: {{tenantName}}',
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
            <h2 style="color: #1f2937; margin-top: 0;">New Tenant Registration 🚀</h2>

            <p>A new gym has registered on GymBossLab!</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Tenant Details:</h3>
              <p><strong>Gym Name:</strong> {{tenantName}}</p>
              <p><strong>Owner Email:</strong> {{ownerEmail}}</p>
              <p><strong>Registration Date:</strong> {{registrationDate}}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{adminPanelUrl}}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View in Admin Panel</a>
            </div>

            <p>Please review the registration and ensure everything is set up correctly.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
            <p>This is an automated notification from GymBossLab.</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
New Tenant Registration 🚀

A new gym has registered on GymBossLab!

Tenant Details:
- Gym Name: {{tenantName}}
- Owner Email: {{ownerEmail}}
- Registration Date: {{registrationDate}}

View in Admin Panel: {{adminPanelUrl}}

Please review the registration and ensure everything is set up correctly.

This is an automated notification from GymBossLab.
      `,
      variables: {
        tenantName: 'New tenant/gym name',
        ownerEmail: 'Owner email address',
        registrationDate: 'Date of registration',
        adminPanelUrl: 'Admin panel URL',
      },
    },
    {
      templateType: 'tenant_notification',
      name: 'New Member Notification',
      subject: 'New Member Joined: {{memberName}}',
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
            <h2 style="color: #1f2937; margin-top: 0;">New Member Joined! 🎉</h2>

            <p>Great news! A new member has joined <strong>{{tenantName}}</strong>.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Member Details:</h3>
               <p><strong>Name:</strong> {{memberName}}</p>
               <p><strong>Email:</strong> {{memberEmail}}</p>
               <p><strong>Membership Plan:</strong> {{membershipPlan}}</p>
               <p><strong>Start Date:</strong> {{startDate}}</p>
               <p><strong>End Date:</strong> {{endDate}}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View in Dashboard</a>
            </div>

            <p>Welcome your new member and help them get started on their fitness journey!</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
            <p>This is an automated notification from GymBossLab.</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
New Member Joined! 🎉

Great news! A new member has joined {{tenantName}}.

Member Details:
- Name: {{memberName}}
- Email: {{memberEmail}}
- Membership Plan: {{membershipPlan}}
- Start Date: {{startDate}}
- End Date: {{endDate}}

View in Dashboard: {{dashboardUrl}}

Welcome your new member and help them get started on their fitness journey!

This is an automated notification from GymBossLab.
      `,
      variables: {
        tenantName: 'Gym/tenant name',
        memberName: 'New member full name',
        memberEmail: 'New member email',
        membershipPlan: 'Membership plan name',
        startDate: 'Membership start date',
        endDate: 'Membership end date',
        dashboardUrl: 'Dashboard URL',
      },
    },
    {
      templateType: 'membership_renewal',
      name: 'Membership Renewal Notification',
      subject: 'Membership Renewed: {{memberName}} - {{tenantName}}',
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
            <h2 style="color: #1f2937; margin-top: 0;">Membership Renewed! 🎉</h2>

            <p>Great news! A membership has been renewed at <strong>{{tenantName}}</strong>.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Renewal Details:</h3>
              <p><strong>Member:</strong> {{memberName}}</p>
              <p><strong>Email:</strong> {{memberEmail}}</p>
              <p><strong>Membership Plan:</strong> {{membershipPlan}}</p>
              <p><strong>New Start Date:</strong> {{startDate}}</p>
              <p><strong>New End Date:</strong> {{endDate}}</p>
              <p><strong>Renewal Date:</strong> {{renewalDate}}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View in Dashboard</a>
            </div>

            <p>The member can continue enjoying all the benefits of their membership!</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 13px;">
            <p>This is an automated notification from GymBossLab.</p>
          </div>
        </body>
        </html>
      `,
      textContent: `
Membership Renewed! 🎉

Great news! A membership has been renewed at {{tenantName}}.

Renewal Details:
- Member: {{memberName}}
- Email: {{memberEmail}}
- Membership Plan: {{membershipPlan}}
- New Start Date: {{startDate}}
- New End Date: {{endDate}}
- Renewal Date: {{renewalDate}}

View in Dashboard: {{dashboardUrl}}

The member can continue enjoying all the benefits of their membership!

This is an automated notification from GymBossLab.
      `,
      variables: {
        tenantName: 'Gym/tenant name',
        memberName: 'Member full name',
        memberEmail: 'Member email',
        membershipPlan: 'Membership plan name',
        startDate: 'New membership start date',
        endDate: 'New membership end date',
        renewalDate: 'Date of renewal',
        dashboardUrl: 'Dashboard URL',
      },
    },
  ];

  for (const template of templates) {
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        templateType: template.templateType,
        tenantId: null, // Global templates
      },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          ...template,
          isActive: true,
        },
      });
      console.log(`✅ Created email template: ${template.name}`);
    } else {
      console.log(`⏭️  Email template already exists: ${template.name}`);
    }
  }
}

async function main() {
  console.log('🌱 Starting simplified database seeding...');

  // Create Super Admin users
  console.log('👑 Creating/Updating Super Admins...');

  const superAdmins = [
    {
      email: 'manuel.markdenver@gmail.com',
      password: 'SuperAdmin123!',
      firstName: 'Mark Denver',
      lastName: 'Manuel',
    },
    {
      email: 'mckee.korea@gmail.com',
      password: 'SuperAdmin123!',
      firstName: 'Aileen',
      lastName: 'Tibayan',
    },
  ];

  const createdSuperAdminEmails = [];

  for (const adminData of superAdmins) {
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'SUPER_ADMIN',
        emailVerified: true, // Seeded users are pre-verified
        // Email preferences
        emailNotificationsEnabled: true,
        marketingEmailsEnabled: false,
      },
    });

    console.log(`✅ Super Admin created: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})`);
    console.log(`🔑 Password: ${adminData.password}`);
    createdSuperAdminEmails.push(superAdmin.email);
  }

  // Create or update SystemSettings with global admin emails
  console.log('⚙️  Setting up System Settings with global admin emails...');
  const systemSettings = await prisma.systemSettings.upsert({
    where: { id: 'system' },
    update: {
      globalAdminEmails: createdSuperAdminEmails,
      newTenantAlertsEnabled: true,
      systemAlertsEnabled: true,
      securityAlertsEnabled: true,
      tenantNotificationsEnabled: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'system',
      passwordSecurityLevel: 'MEDIUM',
      globalAdminEmails: createdSuperAdminEmails,
      newTenantAlertsEnabled: true,
      systemAlertsEnabled: true,
      securityAlertsEnabled: true,
      tenantNotificationsEnabled: true,
    },
  });

  console.log(`✅ System Settings updated with ${createdSuperAdminEmails.length} global admin emails: ${createdSuperAdminEmails.join(', ')}`);

  // Create initial subscription plans
  const plans = [
    {
      name: 'Free Trial',
      price: 0,
      billingCycle: 'TRIAL',
      description: '4 weeks free trial - full access to all features',
      isActive: true,
    },
    {
      name: 'Monthly Pro',
      price: 1500,
      billingCycle: 'MONTHLY',
      description: 'Monthly subscription with full gym management features',
      isActive: true,
    },
    {
      name: 'Annual Pro',
      price: 15000,
      billingCycle: 'YEARLY',
      description: 'Annual subscription - save 2 months! Full gym management features',
      isActive: true,
    },
  ];

  console.log('📦 Creating subscription plans...');
  
  for (const planData of plans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: planData.name },
    });

    if (!existingPlan) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Created plan: ${plan.name} (₱${plan.price})`);
    } else {
      console.log(`⏭️  Plan already exists: ${planData.name}`);
    }
  }

  // Create single tenant - Muscle Mania
  console.log('🏢 Creating Muscle Mania tenant...');
  
  const tenantInfo = {
    name: 'Muscle Mania',
    slug: 'muscle-mania',
    category: 'GYM',
    address: '789 Muscle Road, Cebu City',
    email: 'info@muscle-mania.com',
    phoneNumber: '+63 32 987 6543',
    owner: {
      email: 'owner@muscle-mania.com',
      password: 'MuscleManiaOwner123!',
      firstName: 'Juan',
      lastName: 'Cruz',
      name: 'Juan Cruz'
    }
  };
  
  const loginCredentials = [
    {
      email: superAdmins[0].email,
      password: superAdmins[0].password,
      role: 'SUPER_ADMIN',
      name: `${superAdmins[0].firstName} ${superAdmins[0].lastName}`
    },
    {
      email: superAdmins[1].email,
      password: superAdmins[1].password,
      role: 'SUPER_ADMIN',
      name: `${superAdmins[1].firstName} ${superAdmins[1].lastName}`
    }
  ];
  
  // Check if tenant already exists
  let existingTenant = await prisma.tenant.findUnique({
    where: { slug: tenantInfo.slug }
  });
  
  let tenant, owner;
  
  if (!existingTenant) {
    // Create tenant
    tenant = await prisma.tenant.create({
      data: {
        name: tenantInfo.name,
        slug: tenantInfo.slug,
        category: tenantInfo.category,
        address: tenantInfo.address,
        email: tenantInfo.email,
        phoneNumber: tenantInfo.phoneNumber,
        // Email notification preferences
        emailNotificationsEnabled: true,
        welcomeEmailEnabled: true,
        adminAlertEmailEnabled: true,
        tenantNotificationEmailEnabled: false,
        tenantSignupNotificationEnabled: true,
        adminEmailRecipients: []
      }
    });
    
    console.log(`✅ Created tenant: ${tenant.name}`);
    
    // Create owner
    const hashedOwnerPassword = await bcrypt.hash(tenantInfo.owner.password, 12);
        const owner = await prisma.user.create({
        data: {
          email: tenantInfo.owner.email,
          password: hashedOwnerPassword,
          firstName: tenantInfo.owner.firstName,
          lastName: tenantInfo.owner.lastName,
          role: 'OWNER',
          tenantId: tenant.id, // Set tenant context for owner
          emailVerified: true, // Seeded users are pre-verified
          // Email preferences
          emailNotificationsEnabled: true,
          marketingEmailsEnabled: false,
        }
      });

      // Update tenant with owner's email as default admin recipient
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          adminEmailRecipients: [owner.email]
        }
      });

      // Note: Owner gym profile will be created after branch creation

      console.log(`✅ Created owner: ${owner.email}`);
    loginCredentials.push({
      email: owner.email || '',
      password: tenantInfo.owner.password,
      role: 'OWNER',
      name: owner.name || owner.firstName + ' ' + owner.lastName
    });
    
    // Create gym membership plans for this tenant using new GymMembershipPlan table
    console.log(`🏋️ Creating gym membership plans for ${tenant.name}...`);
    const gymMembershipPlans = [
      {
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS',
        benefits: {
          features: [
            'Full gym access for 1 day',
            'Use of all equipment',
            'Locker access'
          ]
        }
      },
      {
        name: 'Basic Monthly',
        description: 'Standard monthly membership',
        price: 1200,
        duration: 30,
        type: 'MONTHLY',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Locker access',
            'Fitness assessment'
          ]
        }
      },
      {
        name: 'Premium Monthly',
        description: 'Premium monthly membership with PT sessions',
        price: 2500,
        duration: 30,
        type: 'MONTHLY',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            '2 Personal Training sessions',
            'Nutrition consultation',
            'Towel service',
            'Guest passes (2 per month)'
          ]
        }
      },
      {
        name: 'Annual Basic',
        description: 'Basic annual membership - save 2 months!',
        price: 12000,
        duration: 365,
        type: 'ANNUAL',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Locker access',
            'Quarterly fitness assessment',
            '2 months free!'
          ]
        }
      },
      {
        name: 'Student Monthly',
        description: 'Discounted membership for students',
        price: 800,
        duration: 30,
        type: 'STUDENT',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Student discount',
            'Study area access'
          ]
        }
      }
    ];
    
    const createdGymPlans = [];
    for (const planData of gymMembershipPlans) {
       const gymPlan = await prisma.gymMembershipPlan.create({
         data: {
           tenantId: tenant.id,
           name: planData.name,
           description: planData.description,
           price: planData.price,
           duration: planData.duration,
           type: planData.type,
           benefits: planData.benefits,
           isActive: true,
           accessLevel: 'ALL_BRANCHES' // Default all plans to all branches access
         }
       });
      createdGymPlans.push(gymPlan);
      console.log(`✅ Created gym membership plan: ${gymPlan.name} (₱${gymPlan.price})`);
    }
    
    // Create 3 branches with uneven member distribution for realistic analytics testing
    console.log('🏪 Creating branches...');
    const branches = [];
    
    const branch1 = await prisma.branch.create({
      data: {
        name: 'Muscle Mania Manggahan',
        address: '123 Manggahan Street, Pasig City',
        phoneNumber: '+63 2 8123 4567',
        email: 'manggahan@muscle-mania.com',
        isActive: true,
        isMainBranch: true,
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });
    branches.push(branch1);
    console.log(`✅ Created main branch: ${branch1.name}`);
    
    const branch2 = await prisma.branch.create({
      data: {
        name: 'San Rafael Branch',
        address: '456 San Rafael Street, Quezon City',
        phoneNumber: '+63 2 8234 5678',
        email: 'sanrafael@muscle-mania.com',
        isActive: true,
        isMainBranch: false,
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });
    branches.push(branch2);
    console.log(`✅ Created second branch: ${branch2.name}`);
    
    const branch3 = await prisma.branch.create({
      data: {
        name: 'San Jose Branch',
        address: '789 San Jose Avenue, Manila',
        phoneNumber: '+63 2 8345 6789',
        email: 'sanjose@muscle-mania.com',
        isActive: true,
        isMainBranch: false,
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });
    branches.push(branch3);
    console.log(`✅ Created third branch: ${branch3.name}`);
    
    const branch = branch1; // Keep compatibility with existing code
    
    // Create gym member profile for owner (now that branch exists)
    await prisma.gymMemberProfile.create({
      data: {
        userId: owner.id,
        tenantId: tenant.id,
        role: 'GYM_MEMBER', // Business-specific role
        status: 'ACTIVE',
        primaryBranchId: branch.id, // Set primary branch
        accessLevel: 'ALL_BRANCHES' // Owner can access all branches
      }
    });
    console.log(`✅ Created gym profile for owner`);
    
    // Create GymUserBranch relationship for owner
    await prisma.gymUserBranch.create({
      data: {
        userId: owner.id,
        branchId: branch.id,
        tenantId: tenant.id,
        accessLevel: 'FULL_ACCESS'
      }
    });
    console.log(`✅ Assigned owner to branch`);
    
    // Create SaaS subscriptions for both branches
    const monthlyPlan = await prisma.plan.findUnique({ where: { name: 'Monthly Pro' } });
    if (monthlyPlan) {
      for (const branchToSubscribe of branches) {
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = new Date(subscriptionStartDate);
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        
        const subscription = await prisma.subscription.create({
          data: {
            branchId: branchToSubscribe.id,
            planId: monthlyPlan.id,
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            status: 'ACTIVE'
          }
        });
        
        console.log(`✅ Created SaaS subscription: ${monthlyPlan.name} for ${branchToSubscribe.name}`);
        
        // Create payment record
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: monthlyPlan.price,
            paymentDate: subscriptionStartDate,
            status: 'SUCCESSFUL',
            paymentMethod: 'CARD',
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        });
        console.log(`✅ Created payment record for ${branchToSubscribe.name} subscription`);
      }
    }
    
    // Create manager for the branch
    const managerEmail = 'manager@muscle-mania.com';
    const managerPassword = 'Manager123!';
    const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);
    
      const manager = await prisma.user.create({
        data: {
          email: managerEmail,
          password: hashedManagerPassword,
          firstName: 'Manager',
          lastName: 'Cruz',
          role: 'MANAGER',
          tenantId: tenant.id, // Set tenant context for manager
          // Email preferences
          emailNotificationsEnabled: true,
          marketingEmailsEnabled: false,
        }
      });

     // Create gym member profile for manager
     await prisma.gymMemberProfile.create({
       data: {
         userId: manager.id,
         tenantId: tenant.id,
         role: 'GYM_MEMBER', // Business-specific role
         status: 'ACTIVE',
         primaryBranchId: branch.id, // Set primary branch to manage
         accessLevel: 'ALL_BRANCHES' // Manager can access all branches
       }
     });
    
    console.log(`✅ Created manager: ${manager.email}`);
    loginCredentials.push({
      email: manager.email || '',
      password: managerPassword,
      role: 'MANAGER',
      name: manager.name || manager.firstName + ' ' + manager.lastName
    });
    
    // Assign manager to branch
    await prisma.gymUserBranch.create({
      data: {
        userId: manager.id,
        branchId: branch.id,
        tenantId: tenant.id,
        accessLevel: 'MANAGER_ACCESS'
      }
    });
    
    // Create 18 gym members with realistic mix of statuses
    // Distribution: Manggahan (8), San Rafael (6), San Jose (4)
    console.log('👥 Creating 18 realistic gym members...');
    
    const specificMembers = [
      // Active Members (6)
      {
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@muscle-mania.com',
        password: 'Maria123!',
        status: 'ACTIVE',
        description: 'Active premium member'
      },
      {
        firstName: 'John',
        lastName: 'Dela Cruz',
        email: 'john.delacruz@muscle-mania.com',
        password: 'John123!',
        status: 'ACTIVE',
        description: 'Active basic member'
      },
      {
        firstName: 'Andrea',
        lastName: 'Reyes',
        email: 'andrea.reyes@muscle-mania.com',
        password: 'Andrea123!',
        status: 'ACTIVE',
        description: 'Active premium member'
      },
      {
        firstName: 'Carlos',
        lastName: 'Garcia',
        email: 'carlos.garcia@muscle-mania.com',
        password: 'Carlos123!',
        status: 'ACTIVE',
        description: 'Active basic member'
      },
      {
        firstName: 'Jenny',
        lastName: 'Lim',
        email: 'jenny.lim@muscle-mania.com',
        password: 'Jenny123!',
        status: 'ACTIVE',
        description: 'Active student member'
      },
      {
        firstName: 'Michael',
        lastName: 'Torres',
        email: 'michael.torres@muscle-mania.com',
        password: 'Michael123!',
        status: 'ACTIVE',
        description: 'Active annual member'
      },
      // Expiring Soon (2)
      {
        firstName: 'Sofia',
        lastName: 'Ramos',
        email: 'sofia.ramos@muscle-mania.com',
        password: 'Sofia123!',
        status: 'EXPIRING',
        description: 'Expiring premium member'
      },
      {
        firstName: 'Robert',
        lastName: 'Flores',
        email: 'robert.flores@muscle-mania.com',
        password: 'Robert123!',
        status: 'EXPIRING',
        description: 'Expiring basic member'
      },
      // Expired (2) - Including Olivia White as the first expired member
      {
        firstName: 'Olivia',
        lastName: 'White',
        email: 'olivia.white@muscle-mania.com',
        password: 'Olivia123!',
        status: 'ACTIVE',
        description: 'Active basic member with complete profile'
      },
      {
        firstName: 'Amy',
        lastName: 'Taylor',
        email: 'amy.taylor@muscle-mania.com',
        password: 'Amy123!',
        status: 'EXPIRED',
        description: 'Expired member'
      },
      // Cancelled (1)
      {
        firstName: 'Lisa',
        lastName: 'Aquino',
        email: 'lisa.aquino@muscle-mania.com',
        password: 'Lisa123!',
        status: 'CANCELLED',
        description: 'Cancelled member'
      },
      // Deleted (1)
      {
        firstName: 'Mark',
        lastName: 'Fernandez',
        email: 'mark.fernandez@muscle-mania.com',
        password: 'Mark123!',
        status: 'DELETED',
        description: 'Deleted member'
      },
      // Additional Active Members (4 more)
      {
        firstName: 'David',
        lastName: 'Villanueva',
        email: 'david.villanueva@muscle-mania.com',
        password: 'David123!',
        status: 'ACTIVE',
        description: 'Active premium member'
      },
      {
        firstName: 'Patricia',
        lastName: 'Mendoza',
        email: 'patricia.mendoza@muscle-mania.com',
        password: 'Patricia123!',
        status: 'ACTIVE',
        description: 'Active basic member'
      },
      {
        firstName: 'Ricardo',
        lastName: 'Cruz',
        email: 'ricardo.cruz@muscle-mania.com',
        password: 'Ricardo123!',
        status: 'ACTIVE',
        description: 'Active annual member'
      },
      {
        firstName: 'Elena',
        lastName: 'Santiago',
        email: 'elena.santiago@muscle-mania.com',
        password: 'Elena123!',
        status: 'ACTIVE',
        description: 'Active student member'
      },
      // Additional Expired (1)
      {
        firstName: 'Thomas',
        lastName: 'Velasco',
        email: 'thomas.velasco@muscle-mania.com',
        password: 'Thomas123!',
        status: 'EXPIRED',
        description: 'Expired member'
      },
      // Additional Expiring (1)
      {
        firstName: 'Jasmine',
        lastName: 'Bautista',
        email: 'jasmine.bautista@muscle-mania.com',
        password: 'Jasmine123!',
        status: 'EXPIRING',
        description: 'Expiring premium member'
      },
    ];
    
    for (let i = 0; i < specificMembers.length; i++) {
      const memberInfo = specificMembers[i];
      const hashedMemberPassword = await bcrypt.hash(memberInfo.password, 12);
      
        const member = await prisma.user.create({
          data: {
            email: memberInfo.email,
            password: hashedMemberPassword,
            firstName: memberInfo.firstName,
            lastName: memberInfo.lastName,
            role: 'CLIENT', // Global role for end users
            tenantId: tenant.id, // Set tenant context for gym members
            // Email preferences
            emailNotificationsEnabled: true,
            marketingEmailsEnabled: false,
          }
        });

        // Create gym member profile with comprehensive realistic data
        const emergencyContactName = generateEmergencyContactName();
        const trainerData = Math.random() > 0.5 ? {
          name: ['Coach Mike Santos', 'Trainer Ana Reyes', 'PT Carlos Garcia', 'Elena Rodriguez'][Math.floor(Math.random() * 4)],
          contact: `+63 9${17 + Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 900000000) + 100000000}`.substring(0, 14)
        } : null;
        
        const gymProfile = await prisma.gymMemberProfile.create({
          data: {
            userId: member.id,
            tenantId: tenant.id,
            role: 'GYM_MEMBER', // Business-specific role
            status: memberInfo.status === 'DELETED' ? 'CANCELLED' :
                   memberInfo.status === 'EXPIRING' ? 'ACTIVE' :
                   memberInfo.status === 'NO_SUBSCRIPTION' ? 'NO_SUBSCRIPTION' :
                   memberInfo.status,
            
            // Primary branch and access level - distribute members unevenly: 8-6-4
            primaryBranchId: i < 8 ? branch1.id : (i < 14 ? branch2.id : branch3.id), // 0-7: Manggahan, 8-13: San Rafael, 14-17: San Jose
            accessLevel: 'ALL_BRANCHES', // Default access to all branches
            
            // Gym-level soft deletion for DELETED members
            deletedAt: memberInfo.status === 'DELETED' ? new Date() : null,
            deletedBy: memberInfo.status === 'DELETED' ? owner.id : null,
            deletionReason: memberInfo.status === 'DELETED' ? 'Violation of gym policies' : null,
            deletionNotes: memberInfo.status === 'DELETED' ? 'Member was found using inappropriate language and disrupting other members' : null,
            
            // Emergency Contact Information
            emergencyContactName: emergencyContactName,
            emergencyContactPhone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
            emergencyContactRelation: getRandomRelationship(),
            
            // Health & Medical Information
            medicalConditions: Math.random() > 0.8 ? 'None' : ['Asthma', 'Back Pain', 'Knee Issues', 'Shoulder Pain', 'Heart Condition', 'Diabetes'][Math.floor(Math.random() * 6)],
            fitnessGoals: ['Weight Loss', 'Muscle Gain', 'Fitness Maintenance', 'Strength Training', 'Endurance', 'Flexibility', 'Toning', 'Sports Performance'][Math.floor(Math.random() * 8)],
            
            // Trainer Information
            preferredTrainer: trainerData ? trainerData.name : null,
            trainerContactNumber: trainerData ? trainerData.contact : null,
            
            // Personal Details
            gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
            height: i % 2 === 0 ? 165 + Math.floor(Math.random() * 20) : 155 + Math.floor(Math.random() * 15), // Males: 165-185cm, Females: 155-170cm
            weight: i % 2 === 0 ? 60 + Math.floor(Math.random() * 30) : 45 + Math.floor(Math.random() * 25), // Males: 60-90kg, Females: 45-70kg
            dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1), // Age 20-40
            
            // Fitness & Activity Data
            allergies: Math.random() > 0.9 ? ['Nuts', 'Shellfish', 'Dairy', 'Pollen'][Math.floor(Math.random() * 4)] : null,
            lastVisit: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
            totalVisits: Math.max(10, Math.floor(Math.random() * 200) + (i * 10)), // 10-200+ visits based on index
            fitnessLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
            averageVisitsPerWeek: Math.floor(Math.random() * 6) + 1, // 1-6 visits per week
            
            // Preferences
            favoriteEquipment: ['Weights', 'Cardio Machines', 'Yoga Mats', 'Treadmill', 'Dumbbells', 'Resistance Bands', 'Kettlebells', 'Pull-up Bar'][Math.floor(Math.random() * 8)],
            preferredWorkoutTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
            
            // Membership & Activity History
            joinedDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000), // Joined within last 2 years
            membershipHistory: [
              {
                planName: 'Basic Monthly',
                startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'COMPLETED'
              },
              ...(Math.random() > 0.5 ? [{
                planName: 'Premium Monthly',
                startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'COMPLETED'
              }] : [])
            ],
            
            // Notification Preferences
            notifications: {
              email: Math.random() > 0.1, // 90% have email notifications
              sms: Math.random() > 0.6, // 40% have SMS notifications
              push: Math.random() > 0.2 // 80% have push notifications
            },
            
            // Additional Metadata
            profileMetadata: {
              referralSource: ['Friend', 'Social Media', 'Website', 'Gym Advertisement', 'Word of Mouth', 'Corporate Wellness', 'Doctor Referral'][Math.floor(Math.random() * 7)],
              specialNotes: Math.random() > 0.7 ? ['VIP member', 'Corporate member', 'Student discount', 'Senior discount', 'Family package'][Math.floor(Math.random() * 5)] : 'Regular member',
              updatedAt: new Date().toISOString(),
              updatedBy: 'system-seed'
            }
          }
        });
      
      // Create gym member subscription based on status (skip for NO_SUBSCRIPTION)
      if (memberInfo.status !== 'NO_SUBSCRIPTION') {
        let subscriptionStatus;
        let startDate = new Date();
        let endDate = new Date();
        // Use different gym plans for variety - Basic Monthly is at index 1
        let gymMembershipPlan = createdGymPlans[1 + (i % 2)]; // Alternate between Basic Monthly and Premium Monthly
        
        switch (memberInfo.status) {
          case 'ACTIVE':
            subscriptionStatus = 'ACTIVE';
            startDate.setMonth(startDate.getMonth() - 1); // Started 1 month ago
            endDate.setMonth(endDate.getMonth() + 2); // Ends in 2 months
            break;
          case 'CANCELLED':
            subscriptionStatus = 'CANCELLED';
            startDate.setMonth(startDate.getMonth() - 2); // Started 2 months ago
            endDate.setMonth(endDate.getMonth() - 1); // Ended 1 month ago
            break;
          case 'EXPIRING':
            subscriptionStatus = 'ACTIVE';
            startDate.setMonth(startDate.getMonth() - 1); // Started 1 month ago
            endDate.setDate(endDate.getDate() + 3); // Expires in 3 days
            break;
          case 'EXPIRED':
            subscriptionStatus = 'EXPIRED';
            startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago
            endDate.setMonth(endDate.getMonth() - 1); // Expired 1 month ago
            break;
          case 'DELETED':
            subscriptionStatus = 'CANCELLED';
            startDate.setMonth(startDate.getMonth() - 4); // Started 4 months ago
            endDate.setMonth(endDate.getMonth() - 2); // Ended 2 months ago
            break;
          default:
            subscriptionStatus = 'ACTIVE';
        }
        
        const gymMemberSubscription = await prisma.gymMemberSubscription.create({
          data: {
            tenantId: tenant.id,
            memberId: member.id,
            gymMembershipPlanId: gymMembershipPlan.id, // Gym-specific plan ID
            branchId: i < 8 ? branch1.id : (i < 14 ? branch2.id : branch3.id), // 0-7: Manggahan, 8-13: San Rafael, 14-17: San Jose
            status: subscriptionStatus,
            startDate: startDate,
            endDate: endDate,
            price: gymMembershipPlan.price,
            currency: 'PHP',
            autoRenew: memberInfo.status === 'ACTIVE'
          }
        });
        
        // Create payment transaction with current date for analytics visibility
        // Use current date so transactions show up in current period analytics
        const transactionDate = new Date();
        // Add small random offset (0-7 days ago) for realistic data distribution
        transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 7));
        
        await prisma.customerTransaction.create({
          data: {
            tenantId: tenant.id,
            customerId: member.id,
            gymMemberSubscriptionId: gymMemberSubscription.id,
            businessType: 'gym',
            transactionCategory: 'membership',
            amount: gymMembershipPlan.price,
            currency: 'PHP',
            netAmount: gymMembershipPlan.price,
            paymentMethod: 'card',
            transactionType: 'PAYMENT',
            status: 'COMPLETED',
            description: `Payment for ${gymMembershipPlan.name} membership`,
            processedBy: owner.id,
            createdAt: transactionDate  // Use recent date for analytics
          }
        });
      } // End of subscription creation block
      
      // NOTE: Do NOT create GymUserBranch for members with ALL_BRANCHES access
      // ALL_BRANCHES members are tracked via GymMemberProfile.primaryBranchId only
      // GymUserBranch is ONLY for:
      //   - Staff/managers/owners (explicit branch assignments)
      //   - Members with SINGLE_BRANCH or MULTI_BRANCH access levels
      // This prevents double-counting in branch member statistics (fixes 38 members bug)
      
      // Future: When implementing SINGLE_BRANCH/MULTI_BRANCH features, create GymUserBranch here
      // For now, all members have ALL_BRANCHES access, so no GymUserBranch needed
      
      console.log(`✅ Created ${memberInfo.description}: ${member.email} (${memberInfo.status})`);
      loginCredentials.push({
        email: member.email || '',
        password: memberInfo.password,
        role: 'GYM_MEMBER',
        name: member.name || member.firstName + ' ' + member.lastName
      });
    }
    
  } else {
    console.log(`⏭️  Tenant already exists: ${tenantInfo.name}`);
    tenant = existingTenant;
    
    // Get existing owner for this tenant
    owner = await prisma.user.findFirst({
      where: {
        tenantId: existingTenant.id,
        role: 'OWNER'
      }
    });
  }
  
  // Always ensure GymMembershipPlan data exists for the tenant
  const tenantWithPlans = await prisma.tenant.findUnique({
    where: { slug: tenantInfo.slug },
    include: { gymMembershipPlans: true, branches: true }
  });
  
  if (!tenantWithPlans) {
    throw new Error('Tenant not found after creation check');
  }
  
  // Check if gym membership plans exist for this tenant
  if (tenantWithPlans.gymMembershipPlans.length === 0) {
    console.log(`🏋️ Creating gym membership plans for ${tenantWithPlans.name}...`);
    const gymMembershipPlans = [
      {
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS',
        benefits: {
          features: [
            'Full gym access for 1 day',
            'Use of all equipment',
            'Locker access'
          ]
        }
      },
      {
        name: 'Basic Monthly',
        description: 'Standard monthly membership',
        price: 1200,
        duration: 30,
        type: 'MONTHLY',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Locker access',
            'Fitness assessment'
          ]
        }
      },
      {
        name: 'Premium Monthly',
        description: 'Premium monthly membership with PT sessions',
        price: 2500,
        duration: 30,
        type: 'MONTHLY',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            '2 Personal Training sessions',
            'Nutrition consultation',
            'Towel service',
            'Guest passes (2 per month)'
          ]
        }
      },
      {
        name: 'Annual Basic',
        description: 'Basic annual membership - save 2 months!',
        price: 12000,
        duration: 365,
        type: 'ANNUAL',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Locker access',
            'Quarterly fitness assessment',
            '2 months free!'
          ]
        }
      },
      {
        name: 'Student Monthly',
        description: 'Discounted membership for students',
        price: 800,
        duration: 30,
        type: 'STUDENT',
        benefits: {
          features: [
            'Unlimited gym access',
            'Group classes included',
            'Student discount',
            'Study area access'
          ]
        }
      }
    ];
    
    const createdGymPlans = [];
    for (const planData of gymMembershipPlans) {
       const gymPlan = await prisma.gymMembershipPlan.create({
         data: {
           tenantId: tenant.id,
           name: planData.name,
           description: planData.description,
           price: planData.price,
           duration: planData.duration,
           type: planData.type,
           benefits: planData.benefits,
           isActive: true,
           accessLevel: 'ALL_BRANCHES' // Default all plans to all branches access
         }
       });
      createdGymPlans.push(gymPlan);
      console.log(`✅ Created gym membership plan: ${gymPlan.name} (₱${gymPlan.price})`);
    }
  } else {
    console.log(`⏭️  Gym membership plans already exist for ${tenantWithPlans.name} (${tenantWithPlans.gymMembershipPlans.length} plans)`);
  }
  
  // Check if branch exists and create if it doesn't
  if (tenantWithPlans.branches.length === 0 && owner) {
    console.log('🏪 Creating Manggahan branch...');
    const branch = await prisma.branch.create({
      data: {
        name: 'Muscle Mania Manggahan',
        address: '123 Manggahan Street, Pasig City',
        isActive: true,
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });
    console.log(`✅ Created branch: ${branch.name}`);
  } else if (tenantWithPlans.branches.length > 0) {
    console.log(`⏭️  Branch already exists: ${tenantWithPlans.branches[0].name}`);
  }

  console.log('🎉 Simplified database seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('='.repeat(80));
  
  // Group credentials by role
  const credentialsByRole = {
    SUPER_ADMIN: loginCredentials.filter(c => c.role === 'SUPER_ADMIN'),
    OWNER: loginCredentials.filter(c => c.role === 'OWNER'),
    MANAGER: loginCredentials.filter(c => c.role === 'MANAGER'),
    GYM_MEMBER: loginCredentials.filter(c => c.role === 'GYM_MEMBER')
  };
  
  Object.entries(credentialsByRole).forEach(([role, users]) => {
    if (users.length > 0) {
      console.log(`\n🏷️  ${role}S:`);
      users.forEach(user => {
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   ---`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  // Seed default email templates
  console.log('📧 Seeding default email templates...');
  await seedEmailTemplates();

  console.log(`📊 Summary:`);
  console.log(`   • 1 Tenant: Muscle Mania`);
  console.log(`   • 1 Branch: Manggahan`);
  console.log(`   • 12 Members: 6 active, 2 expiring, 2 expired, 1 cancelled, 1 deleted`);
  console.log(`   • Total users: ${loginCredentials.length}`);
  console.log('🚀 You can now login with any of these credentials!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

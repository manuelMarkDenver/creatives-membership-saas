import { PrismaClient, Role, BusinessCategory, AccessLevel } from '@prisma/client';
import bcrypt from 'bcrypt';

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

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Create Super Admin user
  console.log('👑 Creating Super Admin...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@creatives-saas.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        globalRole: 'SUPER_ADMIN',
      }
    });

    console.log(`✅ Created Super Admin: ${superAdmin.email}`);
  }

  // Create tenant configurations
  const tenantConfigs = [
    {
      name: 'Muscle Mania',
      slug: 'muscle-mania',
      category: 'GYM' as BusinessCategory,
      address: '123 Fitness Street, Makati City, Philippines',
      email: 'info@muscle-mania.com',
      phoneNumber: '+63 2 123 4567',
      owner: {
        email: 'owner@muscle-mania.com',
        password: 'MuscleManiaOwner123!',
        firstName: 'Juan',
        lastName: 'Cruz',
        name: 'Juan Cruz'
      }
    }
  ];

  for (const tenantInfo of tenantConfigs) {
    console.log(`🏢 Processing tenant: ${tenantInfo.name}`);

    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantInfo.slug }
    });

    if (existingTenant) {
      console.log(`⏭️  Tenant ${tenantInfo.name} already exists, skipping...`);
      continue;
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantInfo.name,
        slug: tenantInfo.slug,
        category: tenantInfo.category,
        address: tenantInfo.address,
        email: tenantInfo.email,
        phoneNumber: tenantInfo.phoneNumber
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
        globalRole: 'OWNER',
        tenantId: tenant.id,
      }
    });

    // Create gym member profile for owner
    await prisma.gymMemberProfile.create({
      data: {
        userId: owner.id,
        tenantId: tenant.id,
        role: 'GYM_MEMBER',
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Created owner: ${owner.email}`);

    // Create branches for the tenant
    const branches = [
      {
        name: 'Muscle Mania Main',
        address: '123 Main Street, Makati City',
        phoneNumber: '+63 2 123 4567',
        email: 'main@muscle-mania.com'
      },
      {
        name: 'Muscle Mania BGC',
        address: '456 BGC Street, Taguig City',
        phoneNumber: '+63 2 234 5678',
        email: 'bgc@muscle-mania.com'
      }
    ];

    const createdBranches = [];
    for (const branchData of branches) {
      const branch = await prisma.businessUnit.create({
        data: {
          tenantId: tenant.id,
          name: branchData.name,
          type: 'LOCATION',
          address: branchData.address,
          phoneNumber: branchData.phoneNumber,
          email: branchData.email,
          isActive: true
        }
      });
      createdBranches.push(branch);
      console.log(`✅ Created branch: ${branch.name}`);
    }

    // Create membership plans for this tenant
    console.log(`🏋️ Creating membership plans for ${tenant.name}...`);
    const membershipPlans = [
      {
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS',
        benefits: JSON.stringify(['Full gym access', 'Locker room access'])
      },
      {
        name: 'Basic Monthly',
        description: 'Standard monthly membership',
        price: 1200,
        duration: 30,
        type: 'MONTHLY',
        benefits: JSON.stringify(['Full gym access', 'Locker room', 'Free weights', 'Cardio equipment'])
      },
      {
        name: 'Premium Monthly',
        description: 'Premium monthly membership with PT sessions',
        price: 2500,
        duration: 30,
        type: 'MONTHLY',
        benefits: JSON.stringify(['Full gym access', 'Locker room', 'Free weights', 'Cardio equipment', '2 PT sessions/month', 'Nutrition consultation'])
      },
      {
        name: 'Basic Annual',
        description: 'Basic annual membership - save 2 months!',
        price: 12000,
        duration: 365,
        type: 'ANNUAL',
        benefits: JSON.stringify(['Full gym access', 'Locker room', 'Free weights', 'Cardio equipment', '2 months free'])
      },
      {
        name: 'Student Monthly',
        description: 'Discounted membership for students',
        price: 800,
        duration: 30,
        type: 'MONTHLY',
        benefits: JSON.stringify(['Full gym access', 'Locker room', 'Free weights', 'Cardio equipment', 'Valid student ID required'])
      }
    ];

    const createdPlans = [];
    for (const planData of membershipPlans) {
      const plan = await prisma.membershipPlan.create({
        data: {
          tenantId: tenant.id,
          name: planData.name,
          description: planData.description,
          price: planData.price,
          duration: planData.duration,
          type: planData.type,
          benefits: planData.benefits,
          isActive: true
        }
      });
      createdPlans.push(plan);
      console.log(`✅ Created membership plan: ${plan.name} (₱${plan.price})`);
    }

    // Create manager for the first branch
    const managerEmail = 'manager@muscle-mania.com';
    const managerPassword = 'Manager123!';
    const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);

    const manager = await prisma.user.create({
      data: {
        email: managerEmail,
        password: hashedManagerPassword,
        firstName: 'Manager',
        lastName: 'Cruz',
        globalRole: 'MANAGER',
        tenantId: tenant.id,
      }
    });

    // Create gym member profile for manager
    await prisma.gymMemberProfile.create({
      data: {
        userId: manager.id,
        tenantId: tenant.id,
        role: 'GYM_MEMBER',
        status: 'ACTIVE'
      }
    });

    console.log(`✅ Created manager: ${manager.email}`);

    // Assign manager to first branch
    await prisma.gymUserBranch.create({
      data: {
        userId: manager.id,
        branchId: createdBranches[0].id,
        tenantId: tenant.id,
        accessLevel: 'MANAGER_ACCESS'
      }
    });

    // Create exactly 12 gym members with realistic mix of statuses
    console.log('👥 Creating 12 realistic gym members...');

    const specificMembers = [
      { email: 'john.doe@muscle-mania.com', firstName: 'John', lastName: 'Doe', password: 'Member123!', status: 'ACTIVE', description: 'Active premium member' },
      { email: 'jane.smith@muscle-mania.com', firstName: 'Jane', lastName: 'Smith', password: 'Member123!', status: 'ACTIVE', description: 'Active basic member' },
      { email: 'mike.johnson@muscle-mania.com', firstName: 'Mike', lastName: 'Johnson', password: 'Member123!', status: 'ACTIVE', description: 'Active premium member' },
      { email: 'sarah.wilson@muscle-mania.com', firstName: 'Sarah', lastName: 'Wilson', password: 'Member123!', status: 'ACTIVE', description: 'Active basic member' },
      { email: 'alex.brown@muscle-mania.com', firstName: 'Alex', lastName: 'Brown', password: 'Member123!', status: 'ACTIVE', description: 'Active premium member' },
      { email: 'lisa.davis@muscle-mania.com', firstName: 'Lisa', lastName: 'Davis', password: 'Member123!', status: 'ACTIVE', description: 'Active basic member' },
      { email: 'chris.miller@muscle-mania.com', firstName: 'Chris', lastName: 'Miller', password: 'Member123!', status: 'ACTIVE', description: 'Active student member' },
      { email: 'amy.taylor@muscle-mania.com', firstName: 'Amy', lastName: 'Taylor', password: 'Member123!', status: 'ACTIVE', description: 'Active annual member' },
      { email: 'david.anderson@muscle-mania.com', firstName: 'David', lastName: 'Anderson', password: 'Member123!', status: 'EXPIRED', description: 'Expired member' },
      { email: 'emma.thomas@muscle-mania.com', firstName: 'Emma', lastName: 'Thomas', password: 'Member123!', status: 'CANCELLED', description: 'Cancelled member' },
      { email: 'ryan.jackson@muscle-mania.com', firstName: 'Ryan', lastName: 'Jackson', password: 'Member123!', status: 'EXPIRED', description: 'Expired member' },
      { email: 'olivia.white@muscle-mania.com', firstName: 'Olivia', lastName: 'White', password: 'Member123!', status: 'CANCELLED', description: 'Cancelled member' }
    ];

    for (let i = 0; i < specificMembers.length; i++) {
      const memberInfo = specificMembers[i];

      // Check if member already exists
      const existingMember = await prisma.user.findUnique({
        where: { email: memberInfo.email }
      });

      if (existingMember) {
        console.log(`⏭️  Member already exists: ${memberInfo.email}`);
        continue;
      }

      const hashedMemberPassword = await bcrypt.hash(memberInfo.password, 12);

      // Set member active status based on type
      const isActive = memberInfo.status !== 'DELETED';

      const member = await prisma.user.create({
        data: {
          email: memberInfo.email,
          password: hashedMemberPassword,
          firstName: memberInfo.firstName,
          lastName: memberInfo.lastName,
          globalRole: 'CLIENT',
          tenantId: tenant.id,
          isActive: isActive
        }
      });

      // Create gym member profile
      const gymProfile = await prisma.gymMemberProfile.create({
        data: {
          userId: member.id,
          tenantId: tenant.id,
          role: 'GYM_MEMBER',
          status: memberInfo.status === 'DELETED' ? 'CANCELLED' :
                  memberInfo.status === 'EXPIRED' ? 'EXPIRED' :
                  memberInfo.status,
          emergencyContactName: generateEmergencyContactName(),
          emergencyContactPhone: `+63 9${Math.floor(Math.random() * 900000000 + 100000000)}`,
          emergencyContactRelation: getRandomRelationship(),
          medicalConditions: ['None', 'Asthma', 'Back Pain', 'Knee Pain', 'Hypertension'][Math.floor(Math.random() * 5)],
          fitnessGoals: ['Weight Loss', 'Muscle Gain', 'Fitness Maintenance', 'Strength Training', 'Endurance'][Math.floor(Math.random() * 5)],
          gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          height: 150 + Math.floor(Math.random() * 40), // 150-190 cm
          weight: 45 + Math.floor(Math.random() * 60), // 45-105 kg
          dateOfBirth: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          totalVisits: Math.floor(Math.random() * 100) + 10,
          fitnessLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
          notifications: {
            sms: Math.random() > 0.3,
            push: Math.random() > 0.2,
            email: Math.random() > 0.4
          },
          favoriteEquipment: ['Treadmill', 'Dumbbells', 'Bench Press', 'Cable Machine', 'Elliptical'][Math.floor(Math.random() * 5)],
          averageVisitsPerWeek: Math.floor(Math.random() * 5) + 1,
          preferredWorkoutTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
          joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
          membershipHistory: [
            {
              status: 'COMPLETED',
              endDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
              planName: ['Basic Monthly', 'Premium Monthly', 'Student Monthly'][Math.floor(Math.random() * 3)],
              startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          profileMetadata: {
            specialNotes: ['Regular member', 'VIP member', 'New member', 'Returning member', 'Fitness enthusiast'][Math.floor(Math.random() * 5)],
            referralSource: ['Friend', 'Social Media', 'Walk-in', 'Online Search', 'Advertisement'][Math.floor(Math.random() * 5)]
          }
        }
      });

      // Assign member to a random branch
      const randomBranch = createdBranches[Math.floor(Math.random() * createdBranches.length)];
      await prisma.gymUserBranch.create({
        data: {
          userId: member.id,
          branchId: randomBranch.id,
          tenantId: tenant.id,
          accessLevel: 'READ_ONLY'
        }
      });

      // Create gym member subscription based on status
      let subscriptionStatus;
      let startDate = new Date();
      let endDate = new Date();

      // Use different plans for variety - Basic Monthly is at index 1
      let membershipPlan = createdPlans[1 + (i % 2)]; // Alternate between Basic Monthly and Premium Monthly

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
        case 'EXPIRED':
          subscriptionStatus = 'EXPIRED';
          startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago
          endDate.setMonth(endDate.getMonth() - 1); // Expired 1 month ago
          break;
        default:
          subscriptionStatus = 'ACTIVE';
      }

      const gymMemberSubscription = await prisma.gymMemberSubscription.create({
        data: {
          tenantId: tenant.id,
          memberId: member.id,
          membershipPlanId: membershipPlan.id,
          branchId: randomBranch.id,
          status: subscriptionStatus,
          startDate: startDate,
          endDate: endDate,
          price: membershipPlan.price,
          currency: 'PHP',
          autoRenew: memberInfo.status === 'ACTIVE'
        }
      });

      // Create payment record for the subscription
      if (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'CANCELLED') {
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            amount: membershipPlan.price,
            currency: 'PHP',
            netAmount: membershipPlan.price,
            paymentMethod: 'CASH',
            status: 'COMPLETED',
            transactionCategory: 'MEMBERSHIP',
            description: `Payment for ${membershipPlan.name} membership`,
            customerId: member.id,
            userId: member.id,
            paymentDate: startDate,
            referenceNumber: `MM-${member.id.slice(-8).toUpperCase()}-${Date.now()}`
          }
        });
      }

      console.log(`✅ Created ${memberInfo.description}: ${member.email} (${memberInfo.status})`);
    }

    // Create SaaS subscription for the tenant
    const saasSubscription = await prisma.saasSubscription.create({
      data: {
        tenantId: tenant.id,
        planName: 'Business Starter',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        price: 399,
        currency: 'PHP',
        autoRenew: true,
        features: JSON.stringify({
          maxUsers: 50,
          maxBranches: 5,
          supportLevel: 'email',
          features: ['gym_management', 'member_tracking', 'subscription_management']
        })
      }
    });

    console.log(`✅ Created SaaS subscription for ${tenant.name}: ₱${saasSubscription.price}/month`);
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log('   - Super Admin: 1');
  console.log('   - Tenants: 1 (Muscle Mania)');
  console.log('   - Branches: 2 per tenant');
  console.log('   - Gym Members: 12 per tenant');
  console.log('   - Membership Plans: 5 per tenant');
  console.log('   - Total Users: ~16 per tenant');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
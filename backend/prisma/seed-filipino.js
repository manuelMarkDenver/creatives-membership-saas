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

async function main() {
  console.log('🌱 Starting comprehensive Filipino member seeding...');

  // Create Super Admin user
  console.log('👑 Creating Super Admin...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@creatives-saas.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
  
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    
    console.log(`✅ Super Admin created: ${superAdmin.email}`);
  } else {
    console.log(`⏭️  Super Admin already exists: ${superAdminEmail}`);
  }

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
      price: 15000, // 10 months price for yearly (₱1,500 * 10 = ₱15,000)
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
      await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Created plan: ${planData.name} (₱${planData.price})`);
    } else {
      console.log(`⏭️  Plan already exists: ${planData.name}`);
    }
  }

  // Get monthly plan for subscription
  const monthlyPlan = await prisma.plan.findUnique({
    where: { name: 'Monthly Pro' },
  });

  // Create Muscle Mania tenant
  console.log('🏢 Creating Muscle Mania tenant...');
  
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: 'muscle-mania' }
  });
  
  const loginCredentials = [
    {
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    }
  ];

  if (!existingTenant) {
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Muscle Mania',
        slug: 'muscle-mania',
        category: 'GYM',
        address: '789 Muscle Road, Cebu City',
        email: 'info@muscle-mania.com',
        phoneNumber: '+63 32 987 6543'
      }
    });
    
    console.log(`✅ Created tenant: ${tenant.name}`);
    
    // Create owner
    const ownerEmail = 'owner@muscle-mania.com';
    const ownerPassword = 'MuscleManiaOwner123!';
    const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 12);
    
    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: hashedOwnerPassword,
        firstName: 'Juan',
        lastName: 'Cruz',
        name: 'Juan Cruz',
        role: 'OWNER',
        isActive: true,
        tenantId: tenant.id
      }
    });
    
    console.log(`✅ Created owner: ${owner.email}`);
    loginCredentials.push({
      email: owner.email,
      password: ownerPassword,
      role: 'OWNER',
      name: owner.name
    });

    // Create membership plans for gym
    console.log('🏋️ Creating membership plans...');
    const membershipPlans = [
      {
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS'
      },
      {
        name: 'Basic Monthly',
        description: '1 month unlimited gym access',
        price: 2500,
        duration: 30,
        type: 'MONTHLY'
      },
      {
        name: 'Premium Monthly',
        description: '1 month unlimited access + personal trainer',
        price: 3500,
        duration: 30,
        type: 'MONTHLY'
      },
      {
        name: 'Student Monthly',
        description: '1 month access for students (with valid ID)',
        price: 2000,
        duration: 30,
        type: 'MONTHLY'
      }
    ];

    const createdPlans = [];
    for (const planData of membershipPlans) {
      const membershipPlan = await prisma.membershipPlan.create({
        data: {
          tenantId: tenant.id,
          name: planData.name,
          description: planData.description,
          price: planData.price,
          duration: planData.duration,
          type: planData.type,
          isActive: true
        }
      });
      createdPlans.push(membershipPlan);
      console.log(`✅ Created membership plan: ${membershipPlan.name} (₱${membershipPlan.price})`);
    }

    // Create branch
    console.log('🏢 Creating branch: Manggahan...');
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Manggahan',
        address: '123 Manggahan Street, Pasig City',
        isActive: true
      }
    });
    
    console.log(`✅ Created branch: ${branch.name}`);
    
    // Create subscription for branch
    if (monthlyPlan) {
      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date(subscriptionStartDate);
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      
      const subscription = await prisma.subscription.create({
        data: {
          branchId: branch.id,
          planId: monthlyPlan.id,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate,
          status: 'ACTIVE'
        }
      });
      
      console.log(`✅ Created SaaS subscription: ${monthlyPlan.name} for ${branch.name}`);
      
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
      console.log(`✅ Created payment record for ${branch.name} subscription`);
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
        name: 'Manager Cruz',
        role: 'MANAGER',
        isActive: true,
        tenantId: tenant.id
      }
    });
    
    console.log(`✅ Created manager: ${manager.email}`);
    loginCredentials.push({
      email: manager.email,
      password: managerPassword,
      role: 'MANAGER',
      name: manager.name
    });
    
    // Assign manager to branch
    await prisma.userBranch.create({
      data: {
        userId: manager.id,
        branchId: branch.id,
        accessLevel: 'MANAGER_ACCESS'
      }
    });

    // Create exactly 12 gym members with realistic mix of statuses
    console.log('👥 Creating 12 realistic Filipino gym members...');
    
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
      // Expired (2)
      {
        firstName: 'Patricia',
        lastName: 'Mendoza',
        email: 'patricia.mendoza@muscle-mania.com',
        password: 'Patricia123!',
        status: 'EXPIRED',
        description: 'Expired member'
      },
      {
        firstName: 'David',
        lastName: 'Villanueva',
        email: 'david.villanueva@muscle-mania.com',
        password: 'David123!',
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
      }
    ];
    
    for (let i = 0; i < specificMembers.length; i++) {
      const memberInfo = specificMembers[i];
      const hashedMemberPassword = await bcrypt.hash(memberInfo.password, 12);
      
      // Set member active status based on type
      const isActive = memberInfo.status !== 'DELETED';
      
      const memberBusinessData = {
        personalInfo: {
          emergencyContactName: generateEmergencyContactName(),
          emergencyContactPhone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
          emergencyContactRelation: getRandomRelationship(),
          joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last year
          dateOfBirth: new Date(1990 + i, 0, 1).toISOString(),
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          height: 170 + i * 5,
          weight: 70 + i * 5,
          fitnessGoals: 'Fitness Maintenance'
        },
        attendance: {
          totalVisits: 50 - i * 10,
          lastVisit: new Date().toISOString(),
          averageVisitsPerWeek: 3
        },
        healthInfo: {
          medicalConditions: ['None'],
          allergies: ['None'],
          fitnessLevel: 'Intermediate'
        },
        preferences: {
          preferredWorkoutTime: 'Morning',
          favoriteEquipment: 'Weights',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      };
      
      const member = await prisma.user.create({
        data: {
          email: memberInfo.email,
          password: hashedMemberPassword,
          firstName: memberInfo.firstName,
          lastName: memberInfo.lastName,
          name: `${memberInfo.firstName} ${memberInfo.lastName}`,
          role: 'GYM_MEMBER',
          isActive: isActive,
          tenantId: tenant.id,
          businessData: memberBusinessData
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
      
      await prisma.gymMemberSubscription.create({
        data: {
          tenantId: tenant.id,
          memberId: member.id,
          membershipPlanId: membershipPlan.id,
          branchId: branch.id,
          status: subscriptionStatus,
          startDate: startDate,
          endDate: endDate,
          price: membershipPlan.price,
          currency: 'PHP',
          autoRenew: memberInfo.status === 'ACTIVE'
        }
      });
      
      // Create payment transaction
      await prisma.customerTransaction.create({
        data: {
          tenantId: tenant.id,
          customerId: member.id,
          businessType: 'gym',
          transactionCategory: 'membership',
          amount: membershipPlan.price,
          currency: 'PHP',
          netAmount: membershipPlan.price,
          paymentMethod: 'card',
          transactionType: 'PAYMENT',
          status: 'COMPLETED',
          description: `Payment for ${membershipPlan.name} membership`,
          processedBy: owner.id,
          createdAt: startDate
        }
      });
      
      // Create UserBranch relationship
      await prisma.userBranch.create({
        data: {
          userId: member.id,
          branchId: branch.id,
          accessLevel: 'READ_ONLY'
        }
      });
      
      console.log(`✅ Created ${memberInfo.description}: ${member.email} (${memberInfo.status})`);
      loginCredentials.push({
        email: member.email,
        password: memberInfo.password,
        role: 'GYM_MEMBER',
        name: member.name
      });
    }
    
  } else {
    console.log(`⏭️  Tenant already exists: Muscle Mania`);
  }

  console.log('🎉 Comprehensive Filipino member seeding completed!');
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

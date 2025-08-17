import { PrismaClient, BillingCycle, Role, BusinessCategory, MembershipType, GymMemberSubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simplified database seeding...');

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
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
    });
    
    console.log(`✅ Super Admin created: ${superAdmin.email}`);
    console.log(`🔑 Super Admin Password: ${superAdminPassword}`);
  } else {
    console.log(`⏭️  Super Admin already exists: ${superAdminEmail}`);
  }

  // Create initial subscription plans
  const plans = [
    {
      name: 'Free Trial',
      price: 0,
      billingCycle: BillingCycle.TRIAL,
      description: '4 weeks free trial - full access to all features',
      isActive: true,
    },
    {
      name: 'Monthly Pro',
      price: 1500,
      billingCycle: BillingCycle.MONTHLY,
      description: 'Monthly subscription with full gym management features',
      isActive: true,
    },
    {
      name: 'Annual Pro',
      price: 15000,
      billingCycle: BillingCycle.YEARLY,
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
    category: BusinessCategory.GYM,
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
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    }
  ];
  
  // Check if tenant already exists
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: tenantInfo.slug }
  });
  
  if (!existingTenant) {
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
        name: tenantInfo.owner.name,
        role: Role.OWNER,
        isActive: true,
        tenantId: tenant.id
      }
    });
    
    console.log(`✅ Created owner: ${owner.email}`);
    loginCredentials.push({
      email: owner.email || '',
      password: tenantInfo.owner.password,
      role: 'OWNER',
      name: owner.name || owner.firstName + ' ' + owner.lastName
    });
    
    // Create membership plans for this tenant
    console.log(`🏋️ Creating membership plans for ${tenant.name}...`);
    const membershipPlans = [
      {
        name: 'Basic Monthly',
        description: 'Standard monthly membership',
        price: 1200,
        duration: 30,
        type: MembershipType.MONTHLY,
        benefits: JSON.stringify([
          'Unlimited gym access',
          'Group classes included',
          'Locker access',
          'Fitness assessment'
        ])
      },
      {
        name: 'Premium Monthly',
        description: 'Premium monthly membership with PT sessions',
        price: 2500,
        duration: 30,
        type: MembershipType.MONTHLY,
        benefits: JSON.stringify([
          'Unlimited gym access',
          'Group classes included',
          '2 Personal Training sessions',
          'Nutrition consultation',
          'Towel service'
        ])
      }
    ];
    
    const createdPlans: any[] = [];
    for (const planData of membershipPlans) {
      const plan = await prisma.membershipPlan.create({
        data: {
          ...planData,
          tenantId: tenant.id
        }
      });
      createdPlans.push(plan);
      console.log(`✅ Created membership plan: ${plan.name} (₱${plan.price})`);
    }
    
    // Create only Manggahan branch
    console.log('🏪 Creating Manggahan branch...');
    const branch = await prisma.branch.create({
      data: {
        name: 'Muscle Mania Manggahan',
        address: '123 Manggahan Street, Pasig City',
        isActive: true,
        tenantId: tenant.id
      }
    });
    
    console.log(`✅ Created branch: ${branch.name}`);
    
    // Create SaaS subscription for the branch
    const monthlyPlan = await prisma.plan.findUnique({ where: { name: 'Monthly Pro' } });
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
        role: Role.MANAGER,
        isActive: true,
        tenantId: tenant.id
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
    await prisma.userBranch.create({
      data: {
        userId: manager.id,
        branchId: branch.id,
        accessLevel: 'MANAGER_ACCESS'
      }
    });
    
    // Create exactly 5 gym members with specific statuses
    console.log('👥 Creating 5 specific gym members...');
    
    const specificMembers = [
      {
        firstName: 'John',
        lastName: 'Active',
        email: 'john.active@muscle-mania.com',
        password: 'Active123!',
        status: 'ACTIVE',
        description: '1 active member'
      },
      {
        firstName: 'Jane',
        lastName: 'Cancelled',
        email: 'jane.cancelled@muscle-mania.com',
        password: 'Cancelled123!',
        status: 'CANCELLED',
        description: '1 cancelled member'
      },
      {
        firstName: 'Mike',
        lastName: 'Expiring',
        email: 'mike.expiring@muscle-mania.com',
        password: 'Expiring123!',
        status: 'EXPIRING_SOON',
        description: '1 expiring soon member'
      },
      {
        firstName: 'Sarah',
        lastName: 'Expired',
        email: 'sarah.expired@muscle-mania.com',
        password: 'Expired123!',
        status: 'EXPIRED',
        description: '1 expired member'
      },
      {
        firstName: 'Tom',
        lastName: 'Deleted',
        email: 'tom.deleted@muscle-mania.com',
        password: 'Deleted123!',
        status: 'DELETED',
        description: '1 deleted member'
      }
    ];
    
    for (let i = 0; i < specificMembers.length; i++) {
      const memberInfo = specificMembers[i];
      const hashedMemberPassword = await bcrypt.hash(memberInfo.password, 12);
      
      // Set member active status based on type
      const isActive = memberInfo.status !== 'DELETED';
      
      const memberBusinessData = {
        personalInfo: {
          emergencyContact: {
            name: `Emergency ${memberInfo.lastName}`,
            phone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
            relationship: 'Spouse'
          },
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
          role: Role.GYM_MEMBER,
          isActive: isActive,
          tenantId: tenant.id,
          businessData: memberBusinessData
        }
      });
      
      // Create gym member subscription based on status
      let subscriptionStatus: GymMemberSubscriptionStatus;
      let startDate = new Date();
      let endDate = new Date();
      let membershipPlan = createdPlans[0]; // Use Basic Monthly
      
      switch (memberInfo.status) {
        case 'ACTIVE':
          subscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
          startDate.setMonth(startDate.getMonth() - 1); // Started 1 month ago
          endDate.setMonth(endDate.getMonth() + 2); // Ends in 2 months
          break;
        case 'CANCELLED':
          subscriptionStatus = GymMemberSubscriptionStatus.CANCELLED;
          startDate.setMonth(startDate.getMonth() - 2); // Started 2 months ago
          endDate.setMonth(endDate.getMonth() - 1); // Ended 1 month ago
          break;
        case 'EXPIRING_SOON':
          subscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
          startDate.setMonth(startDate.getMonth() - 1); // Started 1 month ago
          endDate.setDate(endDate.getDate() + 3); // Expires in 3 days
          break;
        case 'EXPIRED':
          subscriptionStatus = GymMemberSubscriptionStatus.EXPIRED;
          startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago
          endDate.setMonth(endDate.getMonth() - 1); // Expired 1 month ago
          break;
        case 'DELETED':
          subscriptionStatus = GymMemberSubscriptionStatus.CANCELLED;
          startDate.setMonth(startDate.getMonth() - 4); // Started 4 months ago
          endDate.setMonth(endDate.getMonth() - 2); // Ended 2 months ago
          break;
        default:
          subscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
      }
      
      const gymMemberSubscription = await prisma.gymMemberSubscription.create({
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
        email: member.email || '',
        password: memberInfo.password,
        role: 'GYM_MEMBER',
        name: member.name || member.firstName + ' ' + member.lastName
      });
    }
    
  } else {
    console.log(`⏭️  Tenant already exists: ${tenantInfo.name}`);
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
  console.log(`📊 Summary:`);
  console.log(`   • 1 Tenant: Muscle Mania`);
  console.log(`   • 1 Branch: Manggahan`);
  console.log(`   • 5 Members: 1 active, 1 cancelled, 1 expiring soon, 1 expired, 1 deleted`);
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

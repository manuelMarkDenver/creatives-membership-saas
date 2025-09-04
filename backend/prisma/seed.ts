import { PrismaClient, Role, BillingCycle, MembershipType, GymMemberSubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper functions for generating realistic emergency contact data
function generateEmergencyContactName(): string {
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

function getRandomRelationship(): string {
  const relationships = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Aunt', 'Uncle',
    'Cousin', 'Friend', 'Neighbor', 'Colleague', 'Guardian', 'In-law'
  ];

  return relationships[Math.floor(Math.random() * relationships.length)];
}

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
      description: 'Monthly subscription for professional use',
      isActive: true,
    },
    {
      name: 'Annual Pro',
      price: 15000,
      billingCycle: BillingCycle.YEARLY,
      description: 'Annual subscription with 2 months free',
      isActive: true,
    },
  ];

  const loginCredentials: any[] = [];

  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Plan created: ${plan.name}`);
    } else {
      console.log(`⏭️  Plan already exists: ${plan.name}`);
    }
  }

  // Tenant information
  const tenantInfo = {
    name: 'Muscle Mania',
    slug: 'muscle-mania',
    category: 'GYM',
    address: '123 Fitness Street, Makati City, Philippines',
    email: 'info@muscle-mania.com',
    phoneNumber: '+63 917 123 4567',
    owner: {
      firstName: 'Juan',
      lastName: 'Cruz',
      name: 'Juan Cruz',
      email: 'owner@muscle-mania.com',
      password: 'MuscleManiaOwner123!',
    },
  };

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
        category: 'GYM',
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
        tenant: {
          connect: { id: tenant.id }
        }
      }
    });

    console.log(`✅ Created owner: ${owner.email}`);
    loginCredentials.push({
      email: owner.email,
      password: tenantInfo.owner.password,
      role: 'OWNER',
      name: owner.name || owner.firstName + ' ' + owner.lastName
    });

    // Create membership plans for this tenant
    console.log(`🏋️ Creating membership plans for ${tenant.name}...`);
    const membershipPlans = [
      {
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: MembershipType.DAY_PASS,
        benefits: JSON.stringify([
          'Full gym access for 1 day',
          'Use of all equipment',
          'Locker access'
        ])
      },
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
          'Towel service',
          'Guest passes (2 per month)'
        ])
      },
      {
        name: 'Annual Basic',
        description: 'Basic annual membership - save 2 months!',
        price: 12000,
        duration: 365,
        type: MembershipType.ANNUAL,
        benefits: JSON.stringify([
          'Unlimited gym access',
          'Group classes included',
          'Locker access',
          'Quarterly fitness assessment',
          '2 months free!'
        ])
      },
      {
        name: 'Student Monthly',
        description: 'Discounted membership for students',
        price: 800,
        duration: 30,
        type: MembershipType.STUDENT,
        benefits: JSON.stringify([
          'Unlimited gym access',
          'Group classes included',
          'Student discount',
          'Study area access'
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

    const existingManager = await prisma.user.findUnique({
      where: { email: managerEmail }
    });

    if (!existingManager) {
      const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);
      const manager = await prisma.user.create({
        data: {
          email: managerEmail,
          password: hashedManagerPassword,
          firstName: 'Maria',
          lastName: 'Rodriguez',
          name: 'Maria Rodriguez',
          role: Role.MANAGER,
          isActive: true,
          tenant: {
            connect: { id: tenant.id }
          }
        }
      });

      console.log(`✅ Created manager: ${manager.email}`);
      loginCredentials.push({
        email: manager.email,
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
    }

    // Create exactly 12 gym members with realistic mix of statuses
    console.log('👥 Creating 12 realistic gym members...');

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
        firstName: 'Elena',
        lastName: 'Rodriguez',
        email: 'elena.rodriguez@muscle-mania.com',
        password: 'Elena123!',
        status: 'ACTIVE',
        description: 'Active premium member'
      },
      {
        firstName: 'Miguel',
        lastName: 'Torres',
        email: 'miguel.torres@muscle-mania.com',
        password: 'Miguel123!',
        status: 'ACTIVE',
        description: 'Active basic member'
      },
      // Expiring Members (2)
      {
        firstName: 'Sofia',
        lastName: 'Lopez',
        email: 'sofia.lopez@muscle-mania.com',
        password: 'Sofia123!',
        status: 'EXPIRING',
        description: 'Membership expires soon'
      },
      {
        firstName: 'Diego',
        lastName: 'Martinez',
        email: 'diego.martinez@muscle-mania.com',
        password: 'Diego123!',
        status: 'EXPIRING',
        description: 'Membership expires soon'
      },
      // Expired Members (2)
      {
        firstName: 'Isabella',
        lastName: 'Hernandez',
        email: 'isabella.hernandez@muscle-mania.com',
        password: 'Isabella123!',
        status: 'EXPIRED',
        description: 'Expired member'
      },
      {
        firstName: 'Antonio',
        lastName: 'Gonzalez',
        email: 'antonio.gonzalez@muscle-mania.com',
        password: 'Antonio123!',
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

       const member = await prisma.user.create({
        data: {
          email: memberInfo.email,
          password: hashedMemberPassword,
          firstName: memberInfo.firstName,
          lastName: memberInfo.lastName,
          name: `${memberInfo.firstName} ${memberInfo.lastName}`,
          role: Role.GYM_MEMBER,
          isActive: isActive,
          tenant: {
            connect: { id: tenant.id }
          }
        }
      });

       // Create gym member profile
       const gymProfile = await prisma.gymMemberProfile.create({
        data: {
          userId: member.id,
          emergencyContactName: `${memberInfo.lastName} (Spouse)`,
          emergencyContactPhone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
          emergencyContactRelation: 'Spouse',
          joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
          medicalConditions: 'None',
          fitnessGoals: 'Fitness Maintenance',
          preferredTrainer: null,
          // Profile fields
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          height: 170 + i * 5,
          weight: 70 + i * 5,
          allergies: ['None'],
          lastVisit: new Date(),
          dateOfBirth: new Date(1990 + i, 0, 1),
          totalVisits: 50 - i * 10,
          fitnessLevel: 'Intermediate',
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          favoriteEquipment: 'Weights',
          averageVisitsPerWeek: 3,
          preferredWorkoutTime: 'Morning',
          // Past memberships history
          membershipHistory: [
            {
              planName: 'Basic Monthly',
              startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'COMPLETED'
            }
          ],
          // Additional dynamic data
          profileMetadata: {
            joinedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            referralSource: 'Friend',
            specialNotes: 'Regular member'
          }
        }
      });

     // Create gym member subscription based on status
     let subscriptionStatus;
     let startDate = new Date();
     let endDate = new Date();
     // Use different plans for variety - Basic Monthly is at index 1

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
       case 'EXPIRING':
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
         membershipPlanId: createdPlans[1].id,
         branchId: branch.id,
         status: subscriptionStatus,
         startDate: startDate,
         endDate: endDate,
         price: createdPlans[1].price,
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
         amount: createdPlans[1].price,
         currency: 'PHP',
         netAmount: createdPlans[1].price,
         paymentMethod: 'cash',
         status: 'COMPLETED',
         description: `Membership payment for ${memberInfo.firstName} ${memberInfo.lastName}`,
         processedBy: member.id
       }
     });

     loginCredentials.push({
       email: memberInfo.email,
       password: memberInfo.password,
       role: 'GYM_MEMBER',
       name: member.name || member.firstName + ' ' + member.lastName
     });
   }

 } else {
   console.log(`⏭️  Tenant already exists: ${tenantInfo.name}`);
 }

 // Always create gym members regardless of tenant existence
 const tenant = existingTenant || await prisma.tenant.findUnique({
   where: { slug: tenantInfo.slug }
 });

 if (tenant) {
   // Get or create branch
   let branch = await prisma.branch.findFirst({
     where: { tenantId: tenant.id, name: 'Muscle Mania Manggahan' }
   });

   if (!branch) {
     branch = await prisma.branch.create({
       data: {
         name: 'Muscle Mania Manggahan',
         address: '123 Manggahan Street, Pasig City',
         isActive: true,
         tenantId: tenant.id
       }
     });
     console.log(`✅ Created branch: ${branch.name}`);
   }

   // Get membership plans
   const membershipPlans = await prisma.membershipPlan.findMany({
     where: { tenantId: tenant.id }
   });

   if (membershipPlans.length === 0) {
     // Create membership plans if they don't exist
     const plans = [
       {
         name: 'Basic Monthly',
         description: 'Standard monthly membership',
         price: 1200,
         duration: 30,
         type: MembershipType.MONTHLY,
         benefits: JSON.stringify(['Unlimited gym access', 'Group classes included', 'Locker access'])
       },
       {
         name: 'Premium Monthly',
         description: 'Premium monthly membership with PT sessions',
         price: 2500,
         duration: 30,
         type: MembershipType.MONTHLY,
         benefits: JSON.stringify(['Unlimited gym access', 'Group classes included', '2 Personal Training sessions'])
       }
     ];

     for (const planData of plans) {
       await prisma.membershipPlan.create({
         data: {
           ...planData,
           tenantId: tenant.id
         }
       });
     }
     console.log('✅ Created membership plans');
   }

   // Create exactly 12 gym members with realistic mix of statuses
   console.log('👥 Creating 12 realistic gym members...');

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
       firstName: 'Elena',
       lastName: 'Rodriguez',
       email: 'elena.rodriguez@muscle-mania.com',
       password: 'Elena123!',
       status: 'ACTIVE',
       description: 'Active premium member'
     },
     {
       firstName: 'Miguel',
       lastName: 'Torres',
       email: 'miguel.torres@muscle-mania.com',
       password: 'Miguel123!',
       status: 'ACTIVE',
       description: 'Active basic member'
     },
     // Expiring Members (2)
     {
       firstName: 'Sofia',
       lastName: 'Lopez',
       email: 'sofia.lopez@muscle-mania.com',
       password: 'Sofia123!',
       status: 'EXPIRING',
       description: 'Membership expires soon'
     },
     {
       firstName: 'Diego',
       lastName: 'Martinez',
       email: 'diego.martinez@muscle-mania.com',
       password: 'Diego123!',
       status: 'EXPIRING',
       description: 'Membership expires soon'
     },
     // Expired Members (2)
     {
       firstName: 'Isabella',
       lastName: 'Hernandez',
       email: 'isabella.hernandez@muscle-mania.com',
       password: 'Isabella123!',
       status: 'EXPIRED',
       description: 'Expired member'
     },
     {
       firstName: 'Antonio',
       lastName: 'Gonzalez',
       email: 'antonio.gonzalez@muscle-mania.com',
       password: 'Antonio123!',
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

      const member = await prisma.user.create({
       data: {
         email: memberInfo.email,
         password: hashedMemberPassword,
         firstName: memberInfo.firstName,
         lastName: memberInfo.lastName,
         name: `${memberInfo.firstName} ${memberInfo.lastName}`,
         role: Role.GYM_MEMBER,
         isActive: isActive,
         tenant: {
           connect: { id: tenant.id }
         }
       }
     });

      // Create gym member profile
      const gymProfile = await prisma.gymMemberProfile.create({
       data: {
         userId: member.id,
         emergencyContactName: generateEmergencyContactName(),
         emergencyContactPhone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
         emergencyContactRelation: getRandomRelationship(),
         joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
         medicalConditions: 'None',
         fitnessGoals: 'Fitness Maintenance',
         preferredTrainer: null,
         // Profile fields
         gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
         height: 170 + i * 5,
         weight: 70 + i * 5,
         allergies: ['None'],
         lastVisit: new Date(),
         dateOfBirth: new Date(1990 + i, 0, 1),
         totalVisits: 50 - i * 10,
         fitnessLevel: 'Intermediate',
         notifications: {
           email: true,
           sms: false,
           push: true
         },
         favoriteEquipment: 'Weights',
         averageVisitsPerWeek: 3,
         preferredWorkoutTime: 'Morning',
         // Past memberships history
         membershipHistory: [
           {
             planName: 'Basic Monthly',
             startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
             endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
             status: 'COMPLETED'
           }
         ],
         // Additional dynamic data
         profileMetadata: {
           joinedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
           referralSource: 'Friend',
           specialNotes: 'Regular member'
         }
       }
     });

    // Create gym member subscription based on status
    let subscriptionStatus;
    let startDate = new Date();
    let endDate = new Date();
    // Use different plans for variety - Basic Monthly is at index 1

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
      case 'EXPIRING':
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
        membershipPlanId: membershipPlans[0].id,
        branchId: branch.id,
        status: subscriptionStatus,
        startDate: startDate,
        endDate: endDate,
        price: membershipPlans[0].price,
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
        amount: membershipPlans[0].price,
        currency: 'PHP',
        netAmount: membershipPlans[0].price,
        paymentMethod: 'cash',
        status: 'COMPLETED',
        description: `Membership payment for ${memberInfo.firstName} ${memberInfo.lastName}`,
        processedBy: member.id
      }
    });

    loginCredentials.push({
      email: memberInfo.email,
      password: memberInfo.password,
      role: 'GYM_MEMBER',
      name: member.name || member.firstName + ' ' + member.lastName
    });
  }
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

 // Display credentials
 Object.entries(credentialsByRole).forEach(([role, creds]) => {
   if (creds.length > 0) {
     console.log(`\n🏷️  ${role.replace('_', ' ')}S:`);
     creds.forEach(cred => {
       console.log(`   Name: ${cred.name}`);
       console.log(`   Email: ${cred.email}`);
       console.log(`   Password: ${cred.password}`);
       console.log('   ---');
     });
   }
 });

 console.log('\n==========================================');
 console.log('📊 Summary:');
 console.log(`   • 1 Tenant: ${tenantInfo.name}`);
 console.log(`   • 1 Branch: Manggahan`);
 console.log(`   • 12 Members: 6 active, 2 expiring, 2 expired, 1 cancelled, 1 deleted`);
 console.log(`   • Total users: ${loginCredentials.length}`);
 console.log('🚀 You can now login with any of these credentials!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
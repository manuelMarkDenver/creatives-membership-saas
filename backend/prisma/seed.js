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
        firstName: 'Super',
        lastName: 'Admin',
        globalRole: 'SUPER_ADMIN',
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
          globalRole: 'OWNER',
          tenantId: tenant.id, // Set tenant context for owner
        }
      });

     // Create gym member profile for owner
     await prisma.gymMemberProfile.create({
       data: {
         userId: owner.id,
         tenantId: tenant.id,
         role: 'GYM_MEMBER', // Business-specific role
         status: 'ACTIVE'
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
        name: 'Day Pass',
        description: 'Single day gym access',
        price: 150,
        duration: 1,
        type: 'DAY_PASS',
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
        type: 'MONTHLY',
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
        type: 'MONTHLY',
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
        type: 'ANNUAL',
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
        type: 'STUDENT',
        benefits: JSON.stringify([
          'Unlimited gym access',
          'Group classes included',
          'Student discount',
          'Study area access'
        ])
      }
    ];
    
    const createdPlans = [];
    for (const planData of membershipPlans) {
       const plan = await prisma.membershipPlan.create({
         data: {
           ...planData,
           tenant: {
             connect: { id: tenant.id }
           }
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
         tenant: {
           connect: { id: tenant.id }
         }
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
          globalRole: 'MANAGER',
          tenantId: tenant.id, // Set tenant context for manager
        }
      });

     // Create gym member profile for manager
     await prisma.gymMemberProfile.create({
       data: {
         userId: manager.id,
         tenantId: tenant.id,
         role: 'GYM_MEMBER', // Business-specific role
         status: 'ACTIVE'
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
            globalRole: 'CLIENT', // Global role for end users
            tenantId: tenant.id, // Set tenant context for gym members
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
      } // End of subscription creation block
      
      // Create GymUserBranch relationship (for all members)
      await prisma.gymUserBranch.create({
        data: {
          userId: member.id,
          branchId: branch.id,
          tenantId: tenant.id,
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

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
      price: 15000, // 10 months price for yearly (₱1,500 * 10 = ₱15,000)
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

  // Create sample tenants with users
  console.log('🏢 Creating sample tenants and users...');
  
  const tenantData = [
    {
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
      },
      branches: [{
        name: 'Muscle Mania Manggahan',
        address: '123 Manggahan Street, Pasig City'
      }, {
        name: 'Muscle Mania San Rafael',
        address: '456 San Rafael Avenue, Bulacan'
      }, {
        name: 'Muscle Mania San Jose',
        address: '789 San Jose Road, Nueva Ecija'
      }]
    },
    {
      name: 'Chakara',
      slug: 'chakara',
      category: BusinessCategory.GYM,
      address: '123 Fitness Street, Metro Manila',
      email: 'contact@chakara.com',
      phoneNumber: '+63 2 123 4567',
      owner: {
        email: 'owner@chakara.com',
        password: 'ChakaraOwner123!',
        firstName: 'Maria',
        lastName: 'Santos',
        name: 'Maria Santos'
      },
      branches: [{
        name: 'Chakara Rosario',
        address: '123 Rosario Street, Cavite'
      }, {
        name: 'Chakara San Rafael',
        address: '456 San Rafael Avenue, Bataan'
      }, {
        name: 'Chakara Burgos',
        address: '789 Burgos Road, Pangasinan'
      }]
    }
  ];
  
  const loginCredentials = [
    {
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      name: 'Super Admin'
    }
  ];
  
  for (const tenantInfo of tenantData) {
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
          price: 12000, // 10 months price
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
        },
        {
          name: 'Corporate Package',
          description: 'Special rates for corporate clients',
          price: 20000,
          duration: 30,
          type: MembershipType.CORPORATE,
          benefits: JSON.stringify([
            'Up to 20 employees',
            'Corporate wellness programs',
            'Team building sessions',
            'Health screenings',
            'Flexible scheduling'
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
      
      // Create tenant's SaaS subscription for each branch
      const freePlan = await prisma.plan.findUnique({ where: { name: 'Free Trial' } });
      const monthlyPlan = await prisma.plan.findUnique({ where: { name: 'Monthly Pro' } });
      
      // Create branches and staff
      for (let i = 0; i < tenantInfo.branches.length; i++) {
        const branchInfo = tenantInfo.branches[i];
        const branch = await prisma.branch.create({
          data: {
            name: branchInfo.name,
            address: branchInfo.address,
            isActive: true,
            tenantId: tenant.id
          }
        });
        
        console.log(`✅ Created branch: ${branch.name}`);
        
        // Create SaaS subscription for this branch
        const selectedPlan = i === 0 ? monthlyPlan : freePlan; // First branch gets monthly, others get trial
        if (selectedPlan) {
          const subscriptionStartDate = new Date();
          const subscriptionEndDate = new Date(subscriptionStartDate);
          
          if (selectedPlan.billingCycle === 'MONTHLY') {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
          } else if (selectedPlan.billingCycle === 'YEARLY') {
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
          } else { // TRIAL
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 28); // 4 weeks
          }
          
          const subscription = await prisma.subscription.create({
            data: {
              branchId: branch.id,
              planId: selectedPlan.id,
              startDate: subscriptionStartDate,
              endDate: subscriptionEndDate,
              status: 'ACTIVE'
            }
          });
          
          console.log(`✅ Created SaaS subscription: ${selectedPlan.name} for ${branch.name}`);
          
          // Create payment record for paid subscriptions
          if (selectedPlan.name !== 'Free Trial') {
            await prisma.payment.create({
              data: {
                subscriptionId: subscription.id,
                amount: selectedPlan.price,
                paymentDate: subscriptionStartDate,
                status: 'SUCCESSFUL',
                paymentMethod: 'CARD',
                transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              }
            });
            console.log(`✅ Created payment record for ${branch.name} subscription`);
          }
        }
        
        // Create manager for each branch
        const managerEmail = `manager${i + 1}@${tenantInfo.email.split('@')[1]}`;
        const managerPassword = `Manager${i + 1}23!`;
        const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);
        
        const manager = await prisma.user.create({
          data: {
            email: managerEmail,
            password: hashedManagerPassword,
            firstName: `Manager${i + 1}`,
            lastName: tenantInfo.owner.lastName,
            name: `Manager${i + 1} ${tenantInfo.owner.lastName}`,
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
        
        // Create 2 staff members per branch
        for (let j = 1; j <= 2; j++) {
          const staffEmail = `staff${i + 1}${j}@${tenantInfo.email.split('@')[1]}`;
          const staffPassword = `Staff${i + 1}${j}23!`;
          const hashedStaffPassword = await bcrypt.hash(staffPassword, 12);
          
          const staff = await prisma.user.create({
            data: {
              email: staffEmail,
              password: hashedStaffPassword,
              firstName: `Staff${j}`,
              lastName: `Branch${i + 1}`,
              name: `Staff${j} Branch${i + 1}`,
              role: Role.STAFF,
              isActive: true,
              tenantId: tenant.id
            }
          });
          
          console.log(`✅ Created staff: ${staff.email}`);
          loginCredentials.push({
            email: staff.email || '',
            password: staffPassword,
            role: 'STAFF',
            name: staff.name || staff.firstName + ' ' + staff.lastName
          });
        }
        
        // Assign only the current branch's manager to this branch
        await prisma.userBranch.create({
          data: {
            userId: manager.id,
            branchId: branch.id,
            accessLevel: 'MANAGER_ACCESS'
          }
        });
        
        // Assign only the current branch's staff to this branch
        const currentBranchStaff = await prisma.user.findMany({
          where: {
            tenantId: tenant.id,
            role: Role.STAFF,
            firstName: { startsWith: 'Staff' },
            lastName: `Branch${i + 1}`
          }
        });
        
        for (const staffMember of currentBranchStaff) {
          await prisma.userBranch.create({
            data: {
              userId: staffMember.id,
              branchId: branch.id,
              accessLevel: 'STAFF_ACCESS'
            }
          });
        }
        
        // Create 15-25 gym members per branch with varied activity status
        const baseMemberCount = 15 + Math.floor(Math.random() * 11); // 15-25 members
        const memberNames = [
          'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Chen',
          'Emily Rodriguez', 'Carlos Martinez', 'Lisa Wang', 'Tom Anderson', 'Anna Garcia',
          'Robert Kim', 'Jennifer Lopez', 'Michael Brown', 'Jessica Davis', 'Daniel Lee',
          'Amanda Taylor', 'Chris Wilson', 'Nicole Johnson', 'Brandon Miller', 'Stephanie Jones',
          'Kevin Chen', 'Rachel Green', 'Anthony White', 'Michelle Thompson', 'Jason Park'
        ];
        
        for (let k = 0; k < Math.min(baseMemberCount, memberNames.length); k++) {
          const [firstName, lastName] = memberNames[k].split(' ');
          const memberEmail = `${firstName.toLowerCase()}${k + 1}b${i + 1}@${tenantInfo.email.split('@')[1]}`;
          const memberPassword = `Member${k + 1}23!`;
          const hashedMemberPassword = await bcrypt.hash(memberPassword, 12);
          
          // Random activity status (85% active, 15% inactive)
          const isActive = Math.random() > 0.15;
          
          // Determine subscription status for realistic scenarios:
          // 40% active subscriptions (with some expiring soon), 30% expired subscriptions, 20% expiring within 7 days, 10% no subscription
          const subscriptionScenario = Math.random();
          let hasSubscription = true;
          let subscriptionStatus: GymMemberSubscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
          let membershipPlan, membershipStartDate, membershipEndDate;
          
          if (subscriptionScenario < 0.10) {
            // 10% no active subscription (new members or lapsed members)
            hasSubscription = false;
            membershipPlan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
            membershipStartDate = null;
            membershipEndDate = null;
          } else {
            // Generate member subscription data
            membershipPlan = createdPlans[Math.floor(Math.random() * createdPlans.length)];
            const joinDate = new Date();
            joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 365)); // Random join date within last year
            
            membershipStartDate = new Date(joinDate);
            membershipEndDate = new Date(membershipStartDate);
            membershipEndDate.setDate(membershipEndDate.getDate() + membershipPlan.duration);
            
            if (subscriptionScenario < 0.40) {
              // 30% expired subscriptions (end date in the past)
              const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
              membershipEndDate = new Date();
              membershipEndDate.setDate(membershipEndDate.getDate() - daysAgo);
              subscriptionStatus = GymMemberSubscriptionStatus.EXPIRED;
            } else if (subscriptionScenario < 0.60) {
              // 20% expiring within 7 days (critical expiring members for testing)
              const daysToExpire = Math.floor(Math.random() * 7); // 0-6 days from now (including today and already expired)
              membershipEndDate = new Date();
              if (daysToExpire === 0) {
                // Some expire today (great for testing the popup)
                membershipEndDate.setHours(23, 59, 59, 999); // End of today
              } else {
                membershipEndDate.setDate(membershipEndDate.getDate() + daysToExpire);
              }
              subscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
            } else {
              // 40% active subscriptions with longer time remaining
              const daysToAdd = Math.floor(Math.random() * 90) + 30; // 30-120 days from now
              membershipEndDate = new Date();
              membershipEndDate.setDate(membershipEndDate.getDate() + daysToAdd);
              subscriptionStatus = GymMemberSubscriptionStatus.ACTIVE;
            }
          }
          
          // Simplified member business data - only keep personal info and preferences
          const memberBusinessData = {
            personalInfo: {
              emergencyContact: {
                name: `Emergency ${lastName}`,
                phone: `+63 9${Math.floor(Math.random() * 900000000) + 100000000}`,
                relationship: ['Spouse', 'Parent', 'Sibling', 'Friend'][Math.floor(Math.random() * 4)]
              },
              dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
              gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
              height: 150 + Math.floor(Math.random() * 40), // 150-190 cm
              weight: 45 + Math.floor(Math.random() * 55), // 45-100 kg
              fitnessGoals: ['Weight Loss', 'Muscle Gain', 'Fitness Maintenance', 'Strength Training'][Math.floor(Math.random() * 4)]
            },
            attendance: {
              totalVisits: Math.floor(Math.random() * 200) + 10,
              lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
              averageVisitsPerWeek: Math.floor(Math.random() * 5) + 1
            },
            healthInfo: {
              medicalConditions: Math.random() > 0.8 ? ['None'] : [],
              allergies: Math.random() > 0.9 ? ['None'] : [],
              fitnessLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)]
            },
            preferences: {
              preferredWorkoutTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
              favoriteEquipment: ['Cardio', 'Weights', 'Functional Training'][Math.floor(Math.random() * 3)],
              notifications: {
                email: Math.random() > 0.3,
                sms: Math.random() > 0.5,
                push: Math.random() > 0.4
              }
            }
          };
          
          const member = await prisma.user.create({
            data: {
              email: memberEmail,
              password: hashedMemberPassword,
              firstName: firstName,
              lastName: lastName,
              name: memberNames[k],
              role: Role.GYM_MEMBER,
              isActive: isActive,
              tenantId: tenant.id,
              businessData: memberBusinessData
            }
          });
          
          // Create GymMemberSubscription record only if member has subscription
          if (hasSubscription && membershipStartDate && membershipEndDate) {
            const gymMemberSubscription = await prisma.gymMemberSubscription.create({
              data: {
                tenantId: tenant.id,
                memberId: member.id,
                membershipPlanId: membershipPlan.id,
                branchId: branch.id, // Associate subscription with specific branch
                status: subscriptionStatus,
                startDate: membershipStartDate,
                endDate: membershipEndDate,
                price: membershipPlan.price,
                currency: 'PHP',
                autoRenew: Math.random() > 0.3 // 70% have auto-renew enabled
              }
            });
            
            // Create initial payment transaction
            await prisma.customerTransaction.create({
              data: {
                tenantId: tenant.id,
                customerId: member.id,
                businessType: 'gym',
                transactionCategory: 'membership',
                amount: membershipPlan.price,
                currency: 'PHP',
                netAmount: membershipPlan.price,
                paymentMethod: ['cash', 'card', 'gcash', 'bank_transfer'][Math.floor(Math.random() * 4)],
                transactionType: 'PAYMENT',
                status: 'COMPLETED',
                description: `Initial payment for ${membershipPlan.name} membership`,
                processedBy: owner.id, // Use the tenant owner as the processor
                createdAt: membershipStartDate
              }
            });
          }
          
          // Create additional payment transactions for some members (renewal payments)
          if (hasSubscription && membershipStartDate && Math.random() > 0.6 && membershipPlan.type === 'MONTHLY') {
            const renewalDate = new Date(membershipStartDate);
            renewalDate.setMonth(renewalDate.getMonth() + 1);
            
            await prisma.customerTransaction.create({
              data: {
                tenantId: tenant.id,
                customerId: member.id,
                businessType: 'gym',
                transactionCategory: 'membership',
                amount: membershipPlan.price,
                currency: 'PHP',
                netAmount: membershipPlan.price,
                paymentMethod: ['cash', 'card', 'gcash', 'bank_transfer'][Math.floor(Math.random() * 4)],
                transactionType: 'PAYMENT',
                status: 'COMPLETED',
                description: `Monthly renewal payment for ${membershipPlan.name}`,
                processedBy: owner.id, // Use the tenant owner as the processor
                createdAt: renewalDate
              }
            });
          }
          
          // Create UserBranch relationship for the member
          await prisma.userBranch.create({
            data: {
              userId: member.id,
              branchId: branch.id,
              accessLevel: 'READ_ONLY' // Members have read-only access
            }
          });
          
          const subscriptionStatusText = hasSubscription ? subscriptionStatus : 'NO SUBSCRIPTION';
          console.log(`✅ Created member: ${member.email} (${isActive ? 'active' : 'inactive'}) with ${subscriptionStatusText} subscription`);
          loginCredentials.push({
            email: member.email || '',
            password: memberPassword,
            role: 'GYM_MEMBER',
            name: member.name || member.firstName + ' ' + member.lastName
          });
        }
      }
    } else {
      console.log(`⏭️  Tenant already exists: ${tenantInfo.name}`);
    }
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('=' .repeat(80));
  
  // Group credentials by role
  const credentialsByRole = {
    SUPER_ADMIN: loginCredentials.filter(c => c.role === 'SUPER_ADMIN'),
    OWNER: loginCredentials.filter(c => c.role === 'OWNER'),
    MANAGER: loginCredentials.filter(c => c.role === 'MANAGER'),
    STAFF: loginCredentials.filter(c => c.role === 'STAFF'),
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
  console.log(`📊 Total users created: ${loginCredentials.length}`);
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

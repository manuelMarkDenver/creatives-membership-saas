const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seeder...');
  
  try {
    // 1. Create Tenants
    console.log('📋 Creating tenants...');
    
    const powerflexTenant = await prisma.tenant.create({
      data: {
        id: '881721d5-f61d-47a9-800f-a87aa5e938f0',
        name: 'PowerFlex Fitness',
        slug: 'powerflex-fitness',
        category: 'GYM',
        createdAt: new Date('2024-01-01'),
        address: '789 Muscle Road, Cebu City',
        phoneNumber: '+63 32 123 4567',
        email: 'info@powerflex-fitness.com',
        websiteUrl: 'https://powerflex-fitness.com'
      }
    });
    
    const fitlifeTenant = await prisma.tenant.create({
      data: {
        id: 'ebedb5b0-041b-46d8-80a8-e921b358ae49',
        name: 'FitLife Gym',
        slug: 'fitlife-gym',
        category: 'GYM',
        createdAt: new Date('2024-01-15'),
        address: '456 Health Avenue, Manila',
        phoneNumber: '+63 2 987 6543',
        email: 'hello@fitlife-gym.com',
        websiteUrl: 'https://fitlife-gym.com'
      }
    });

    // 2. Create Branches for each tenant
    console.log('🏢 Creating branches...');
    
    // PowerFlex branches
    const powerflexMain = await prisma.branch.create({
      data: {
        id: '26485d13-8e13-427d-b564-7eceadfe844d',
        tenantId: powerflexTenant.id,
        name: 'PowerFlex Main',
        address: '789 Muscle Road, Cebu City',
        phoneNumber: '+63 32 123 4567',
        isActive: true,
        createdAt: new Date('2024-01-01')
      }
    });

    const powerflexNorth = await prisma.branch.create({
      data: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        tenantId: powerflexTenant.id,
        name: 'PowerFlex North',
        address: '123 Fitness Street, Lapu-Lapu City',
        phoneNumber: '+63 32 234 5678',
        isActive: true,
        createdAt: new Date('2024-02-01')
      }
    });

    const powerflexSouth = await prisma.branch.create({
      data: {
        id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        tenantId: powerflexTenant.id,
        name: 'PowerFlex South',
        address: '456 Strength Avenue, Talisay City',
        phoneNumber: '+63 32 345 6789',
        isActive: true,
        createdAt: new Date('2024-03-01')
      }
    });

    // FitLife branches
    const fitlifeMain = await prisma.branch.create({
      data: {
        id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        tenantId: fitlifeTenant.id,
        name: 'FitLife Main',
        address: '456 Health Avenue, Manila',
        phoneNumber: '+63 2 987 6543',
        isActive: true,
        createdAt: new Date('2024-01-15')
      }
    });

    const fitlifeEast = await prisma.branch.create({
      data: {
        id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
        tenantId: fitlifeTenant.id,
        name: 'FitLife East',
        address: '789 Wellness Road, Quezon City',
        phoneNumber: '+63 2 876 5432',
        isActive: true,
        createdAt: new Date('2024-02-15')
      }
    });

    const fitlifeWest = await prisma.branch.create({
      data: {
        id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
        tenantId: fitlifeTenant.id,
        name: 'FitLife West',
        address: '321 Vitality Plaza, Makati City',
        phoneNumber: '+63 2 765 4321',
        isActive: true,
        createdAt: new Date('2024-03-15')
      }
    });

    // 3. Create Membership Plans
    console.log('💳 Creating membership plans...');
    
    const membershipPlans = await prisma.membershipPlan.createMany({
      data: [
        // PowerFlex plans
        {
          id: 'c9f9e753-5336-4bd1-82d7-92500cbc88e1',
          tenantId: powerflexTenant.id,
          name: 'Basic Monthly',
          type: 'MONTHLY',
          price: 1200,
          duration: 30,
          description: 'Basic gym access with cardio and weights'
        },
        {
          id: '7512cd80-ccd5-4fc0-98eb-9a2616c2b4a0',
          tenantId: powerflexTenant.id,
          name: 'Annual Basic',
          type: 'ANNUAL',
          price: 12000,
          duration: 365,
          description: 'Annual membership with full gym access'
        },
        {
          id: '6162473d-b0a3-4819-a334-ff5c82191630',
          tenantId: powerflexTenant.id,
          name: 'Student Monthly',
          type: 'STUDENT',
          price: 800,
          duration: 30,
          description: 'Discounted rate for students'
        },
        {
          id: 'ba568fbb-1825-4cba-bff7-cdd6df63a8fa',
          tenantId: powerflexTenant.id,
          name: 'Corporate Package',
          type: 'CORPORATE',
          price: 20000,
          duration: 90,
          description: 'Corporate quarterly membership'
        },
        {
          id: 'f3fb472b-1467-4da7-9788-0cfa2bf4c709',
          tenantId: powerflexTenant.id,
          name: 'Day Pass',
          type: 'DAY_PASS',
          price: 150,
          duration: 1,
          description: 'Single day access'
        },
        // FitLife plans
        {
          id: 'f1e2d3c4-b5a6-9877-8654-321098765432',
          tenantId: fitlifeTenant.id,
          name: 'Weekly Pass',
          type: 'WEEKLY',
          price: 500,
          duration: 7,
          description: 'One week unlimited access'
        },
        {
          id: 'f2e3d4c5-b6a7-9878-8655-432109876543',
          tenantId: fitlifeTenant.id,
          name: 'Monthly Premium',
          type: 'MONTHLY',
          price: 1500,
          duration: 30,
          description: 'Premium monthly with all classes'
        },
        {
          id: 'f3e4d5c6-b7a8-9879-8656-543210987654',
          tenantId: fitlifeTenant.id,
          name: 'Quarterly Elite',
          type: 'QUARTERLY',
          price: 4000,
          duration: 90,
          description: 'Elite quarterly membership'
        }
      ]
    });

    // 4. Create Super Admin user
    console.log('👑 Creating Super Admin...');
    
    // Hash passwords for dev login
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: 'super-admin-uuid-1234-5678-901234567890',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@system.com',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        tenantId: null, // Super admin doesn't belong to any tenant
        isActive: true,
        createdAt: new Date('2024-01-01')
      }
    });

    // 5. Create tenant users with role hierarchy
    console.log('👥 Creating tenant users...');
    
    // Hash common passwords for all users
    const ownerPassword = await bcrypt.hash('Owner123!', 10);
    const managerPassword = await bcrypt.hash('Manager123!', 10);
    const staffPassword = await bcrypt.hash('Staff123!', 10);
    
    // PowerFlex users
    const powerflexOwner = await prisma.user.create({
      data: {
        id: 'pf-owner-uuid-1234-5678-901234567890',
        firstName: 'John',
        lastName: 'PowerFlex',
        email: 'owner@powerflex-fitness.com',
        password: ownerPassword,
        phoneNumber: '+63 32 123 4567',
        role: 'OWNER',
        tenantId: powerflexTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-02')
      }
    });

    const powerflexManager1 = await prisma.user.create({
      data: {
        id: '0cb663f3-60b1-4f1a-aa0a-d0c690607836',
        firstName: 'Sarah',
        lastName: 'Manager',
        email: 'manager1@powerflex-fitness.com',
        password: managerPassword,
        phoneNumber: '+63 32 234 5678',
        role: 'MANAGER',
        tenantId: powerflexTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-05')
      }
    });

    const powerflexManager2 = await prisma.user.create({
      data: {
        id: 'pf-mgr2-uuid-1234-5678-901234567890',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        email: 'manager2@powerflex-fitness.com',
        password: managerPassword,
        phoneNumber: '+63 32 345 6789',
        role: 'MANAGER',
        tenantId: powerflexTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-06')
      }
    });

    const powerflexStaff1 = await prisma.user.create({
      data: {
        id: 'd05853a6-78b7-4184-8235-4a9f5fbfeb7f',
        firstName: 'Lisa',
        lastName: 'Trainer',
        email: 'staff11@powerflex-fitness.com',
        password: staffPassword,
        phoneNumber: '+63 32 456 7890',
        role: 'STAFF',
        tenantId: powerflexTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-10')
      }
    });

    const powerflexStaff2 = await prisma.user.create({
      data: {
        id: '256708cc-79a8-4ed3-9cc7-3bd0909cf2be',
        firstName: 'Carlos',
        lastName: 'Instructor',
        email: 'staff12@powerflex-fitness.com',
        password: staffPassword,
        phoneNumber: '+63 32 567 8901',
        role: 'STAFF',
        tenantId: powerflexTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-11')
      }
    });

    // FitLife users
    const fitlifeOwner = await prisma.user.create({
      data: {
        id: 'fl-owner-uuid-1234-5678-901234567890',
        firstName: 'Maria',
        lastName: 'FitLife',
        email: 'owner@fitlife-gym.com',
        password: ownerPassword,
        phoneNumber: '+63 2 987 6543',
        role: 'OWNER',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-16')
      }
    });

    const fitlifeManager1 = await prisma.user.create({
      data: {
        id: 'fl-mgr1-uuid-1234-5678-901234567890',
        firstName: 'David',
        lastName: 'Lee',
        email: 'manager11@fitlife-gym.com',
        password: managerPassword,
        phoneNumber: '+63 2 876 5432',
        role: 'MANAGER',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-20')
      }
    });

    const fitlifeManager2 = await prisma.user.create({
      data: {
        id: 'fl-mgr2-uuid-1234-5678-901234567890',
        firstName: 'Anna',
        lastName: 'Garcia',
        email: 'manager12@fitlife-gym.com',
        password: managerPassword,
        phoneNumber: '+63 2 765 4321',
        role: 'MANAGER',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-21')
      }
    });

    const fitlifeStaff1 = await prisma.user.create({
      data: {
        id: '0c1c5864-1cec-4657-a9f5-253530dc648e',
        firstName: 'Kevin',
        lastName: 'Trainer',
        email: 'staff11@fitlife-gym.com',
        password: staffPassword,
        phoneNumber: '+63 2 654 3210',
        role: 'STAFF',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-25')
      }
    });

    const fitlifeStaff2 = await prisma.user.create({
      data: {
        id: '689d9260-2839-453d-a87f-dab7d024fa16',
        firstName: 'Nina',
        lastName: 'Coach',
        email: 'staff12@fitlife-gym.com',
        password: staffPassword,
        phoneNumber: '+63 2 543 2109',
        role: 'STAFF',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-26')
      }
    });

    const fitlifeStaff3 = await prisma.user.create({
      data: {
        id: '990cd086-4f41-4e85-b2e4-090fd51b3be7',
        firstName: 'Roberto',
        lastName: 'Fitness',
        email: 'staff21@fitlife-gym.com',
        password: staffPassword,
        phoneNumber: '+63 2 432 1098',
        role: 'STAFF',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-27')
      }
    });

    const fitlifeStaff4 = await prisma.user.create({
      data: {
        id: '4860fae7-3016-4e5b-9696-aafbd5105077',
        firstName: 'Grace',
        lastName: 'Wellness',
        email: 'staff22@fitlife-gym.com',
        password: staffPassword,
        phoneNumber: '+63 2 321 0987',
        role: 'STAFF',
        tenantId: fitlifeTenant.id,
        isActive: true,
        createdAt: new Date('2024-01-28')
      }
    });

    // 6. Assign branch access to users
    console.log('🔐 Assigning branch access...');
    
    // PowerFlex branch assignments
    await prisma.userBranch.createMany({
      data: [
        // Manager1 has access to Main and North
        { userId: powerflexManager1.id, branchId: powerflexMain.id, accessLevel: 'MANAGER_ACCESS', isPrimary: true },
        { userId: powerflexManager1.id, branchId: powerflexNorth.id, accessLevel: 'MANAGER_ACCESS', isPrimary: false },
        
        // Manager2 has access to South and North
        { userId: powerflexManager2.id, branchId: powerflexSouth.id, accessLevel: 'MANAGER_ACCESS', isPrimary: true },
        { userId: powerflexManager2.id, branchId: powerflexNorth.id, accessLevel: 'MANAGER_ACCESS', isPrimary: false },
        
        // Staff1 only at Main
        { userId: powerflexStaff1.id, branchId: powerflexMain.id, accessLevel: 'STAFF_ACCESS', isPrimary: true },
        
        // Staff2 only at South
        { userId: powerflexStaff2.id, branchId: powerflexSouth.id, accessLevel: 'STAFF_ACCESS', isPrimary: true }
      ]
    });

    // FitLife branch assignments
    await prisma.userBranch.createMany({
      data: [
        // Manager1 has access to Main and East
        { userId: fitlifeManager1.id, branchId: fitlifeMain.id, accessLevel: 'MANAGER_ACCESS', isPrimary: true },
        { userId: fitlifeManager1.id, branchId: fitlifeEast.id, accessLevel: 'MANAGER_ACCESS', isPrimary: false },
        
        // Manager2 has access to West and East
        { userId: fitlifeManager2.id, branchId: fitlifeWest.id, accessLevel: 'MANAGER_ACCESS', isPrimary: true },
        { userId: fitlifeManager2.id, branchId: fitlifeEast.id, accessLevel: 'MANAGER_ACCESS', isPrimary: false },
        
        // Staff1 at Main and East
        { userId: fitlifeStaff1.id, branchId: fitlifeMain.id, accessLevel: 'STAFF_ACCESS', isPrimary: true },
        { userId: fitlifeStaff1.id, branchId: fitlifeEast.id, accessLevel: 'STAFF_ACCESS', isPrimary: false },
        
        // Staff2 at Main and East
        { userId: fitlifeStaff2.id, branchId: fitlifeMain.id, accessLevel: 'STAFF_ACCESS', isPrimary: false },
        { userId: fitlifeStaff2.id, branchId: fitlifeEast.id, accessLevel: 'STAFF_ACCESS', isPrimary: true },
        
        // Staff3 at West and East
        { userId: fitlifeStaff3.id, branchId: fitlifeWest.id, accessLevel: 'STAFF_ACCESS', isPrimary: true },
        { userId: fitlifeStaff3.id, branchId: fitlifeEast.id, accessLevel: 'STAFF_ACCESS', isPrimary: false },
        
        // Staff4 only at West
        { userId: fitlifeStaff4.id, branchId: fitlifeWest.id, accessLevel: 'STAFF_ACCESS', isPrimary: true }
      ]
    });

    // 7. Create customers with varied membership statuses and expiration dates
    console.log('🏃‍♀️ Creating customers and subscriptions...');
    
    const today = new Date();
    const branches = [powerflexMain, powerflexNorth, powerflexSouth, fitlifeMain, fitlifeEast, fitlifeWest];
    const plans = [
      { id: 'c9f9e753-5336-4bd1-82d7-92500cbc88e1', price: 1200, months: 1 },
      { id: '7512cd80-ccd5-4fc0-98eb-9a2616c2b4a0', price: 12000, months: 12 },
      { id: '6162473d-b0a3-4819-a334-ff5c82191630', price: 800, months: 1 },
      { id: 'ba568fbb-1825-4cba-bff7-cdd6df63a8fa', price: 20000, months: 3 },
      { id: 'f3fb472b-1467-4da7-9788-0cfa2bf4c709', price: 150, months: 0 },
      { id: 'f1e2d3c4-b5a6-9877-8654-321098765432', price: 500, months: 0 },
      { id: 'f2e3d4c5-b6a7-9878-8655-432109876543', price: 1500, months: 1 },
      { id: 'f3e4d5c6-b7a8-9879-8656-543210987654', price: 4000, months: 3 }
    ];

    const customers = [];
    const subscriptions = [];

    // Helper function to get random date
    function getRandomDate(daysFromNow) {
      const date = new Date(today);
      date.setDate(date.getDate() + daysFromNow);
      return date;
    }

    // Helper function to get random element
    function getRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // Create customers with different scenarios
    const customerScenarios = [
      // Critical: Already expired (negative days)
      { daysToExpiry: -5, status: 'ACTIVE', urgency: 'critical' },
      { daysToExpiry: -2, status: 'ACTIVE', urgency: 'critical' },
      { daysToExpiry: -1, status: 'ACTIVE', urgency: 'critical' },
      { daysToExpiry: 0, status: 'ACTIVE', urgency: 'critical' },
      
      // Critical: Expiring today/tomorrow
      { daysToExpiry: 1, status: 'ACTIVE', urgency: 'critical' },
      { daysToExpiry: 1, status: 'ACTIVE', urgency: 'critical' },
      
      // High: 2-3 days
      { daysToExpiry: 2, status: 'ACTIVE', urgency: 'high' },
      { daysToExpiry: 3, status: 'ACTIVE', urgency: 'high' },
      { daysToExpiry: 3, status: 'ACTIVE', urgency: 'high' },
      
      // Medium: 4-7 days
      { daysToExpiry: 4, status: 'ACTIVE', urgency: 'medium' },
      { daysToExpiry: 5, status: 'ACTIVE', urgency: 'medium' },
      { daysToExpiry: 6, status: 'ACTIVE', urgency: 'medium' },
      { daysToExpiry: 7, status: 'ACTIVE', urgency: 'medium' },
      
      // Some future expirations (8-30 days)
      { daysToExpiry: 10, status: 'ACTIVE', urgency: 'low' },
      { daysToExpiry: 15, status: 'ACTIVE', urgency: 'low' },
      { daysToExpiry: 20, status: 'ACTIVE', urgency: 'low' },
      { daysToExpiry: 25, status: 'ACTIVE', urgency: 'low' },
      { daysToExpiry: 30, status: 'ACTIVE', urgency: 'low' },
      
      // Some cancelled/suspended memberships
      { daysToExpiry: 5, status: 'CANCELLED', urgency: 'none' },
      { daysToExpiry: 10, status: 'SUSPENDED', urgency: 'none' },
      { daysToExpiry: 15, status: 'CANCELLED', urgency: 'none' },
    ];

    const firstNames = ['Alex', 'Maria', 'John', 'Sarah', 'Mike', 'Lisa', 'David', 'Anna', 'Carlos', 'Nina', 'Roberto', 'Grace', 'Kevin', 'Emma', 'Daniel', 'Sophie', 'Ryan', 'Olivia', 'Jake', 'Mia', 'Chris', 'Zoe', 'Mark', 'Ava'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'];

    for (let i = 0; i < customerScenarios.length; i++) {
      const scenario = customerScenarios[i];
      const branch = getRandom(branches);
      const plan = getRandom(plans.filter(p => 
        (branch.tenantId === powerflexTenant.id && ['c9f9e753-5336-4bd1-82d7-92500cbc88e1', '7512cd80-ccd5-4fc0-98eb-9a2616c2b4a0', '6162473d-b0a3-4819-a334-ff5c82191630', 'ba568fbb-1825-4cba-bff7-cdd6df63a8fa', 'f3fb472b-1467-4da7-9788-0cfa2bf4c709'].includes(p.id)) ||
        (branch.tenantId === fitlifeTenant.id && ['f1e2d3c4-b5a6-9877-8654-321098765432', 'f2e3d4c5-b6a7-9878-8655-432109876543', 'f3e4d5c6-b7a8-9879-8656-543210987654'].includes(p.id))
      ));
      
      const firstName = getRandom(firstNames);
      const lastName = getRandom(lastNames);
      
      // Create customer as User with GYM_MEMBER role
      const customer = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}${i+1}b1@${branch.tenantId === powerflexTenant.id ? 'powerflex-fitness' : 'fitlife-gym'}.com`,
          phoneNumber: `+63 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
          role: 'GYM_MEMBER',
          tenantId: branch.tenantId,
          isActive: scenario.status === 'ACTIVE',
          createdAt: getRandomDate(-Math.floor(Math.random() * 180)) // Random date in past 6 months
        }
      });

      // Calculate start and end dates
      const endDate = getRandomDate(scenario.daysToExpiry);
      const startDate = new Date(endDate);
      if (plan.months > 0) {
        startDate.setMonth(startDate.getMonth() - plan.months);
      } else {
        startDate.setDate(startDate.getDate() - 7); // For day passes and weekly
      }

      // Create subscription
      const subscription = await prisma.customerSubscription.create({
        data: {
          tenantId: branch.tenantId,
          branchId: branch.id,
          customerId: customer.id,
          membershipPlanId: plan.id,
          status: scenario.status,
          startDate,
          endDate,
          price: plan.price,
          currency: 'PHP',
          autoRenew: Math.random() > 0.3, // 70% auto-renew
          createdAt: startDate
        }
      });

      customers.push(customer);
      subscriptions.push(subscription);
    }

    console.log('📊 Seeding summary:');
    console.log(`- Tenants: 2 (PowerFlex Fitness, FitLife Gym)`);
    console.log(`- Branches: 6 (3 per tenant)`);
    console.log(`- Users: 11 (1 Super Admin, 2 Owners, 4 Managers, 4 Staff)`);
    console.log(`- Membership Plans: 8 (5 PowerFlex, 3 FitLife)`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Subscriptions: ${subscriptions.length}`);
    
    // Show expiration summary
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
    const expired = activeSubscriptions.filter(s => new Date(s.endDate) < today).length;
    const critical = activeSubscriptions.filter(s => {
      const days = Math.ceil((new Date(s.endDate) - today) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 1;
    }).length;
    const high = activeSubscriptions.filter(s => {
      const days = Math.ceil((new Date(s.endDate) - today) / (1000 * 60 * 60 * 24));
      return days >= 2 && days <= 3;
    }).length;
    const medium = activeSubscriptions.filter(s => {
      const days = Math.ceil((new Date(s.endDate) - today) / (1000 * 60 * 60 * 24));
      return days >= 4 && days <= 7;
    }).length;
    
    console.log(`\n📈 Expiration breakdown (active memberships):`);
    console.log(`- Already expired: ${expired}`);
    console.log(`- Critical (≤1 day): ${critical}`);
    console.log(`- High (2-3 days): ${high}`);
    console.log(`- Medium (4-7 days): ${medium}`);
    console.log(`- Future (8+ days): ${activeSubscriptions.length - expired - critical - high - medium}`);
    
    console.log('\n🎯 Test users for different roles:');
    console.log('- Super Admin: superadmin@system.com');
    console.log('- PowerFlex Owner: owner@powerflex-fitness.com (sees all 3 branches)');
    console.log('- PowerFlex Manager1: manager1@powerflex-fitness.com (Main + North branches)');
    console.log('- PowerFlex Manager2: manager2@powerflex-fitness.com (South + North branches)');
    console.log('- PowerFlex Staff1: staff11@powerflex-fitness.com (Main branch only)');
    console.log('- PowerFlex Staff2: staff12@powerflex-fitness.com (South branch only)');
    console.log('- FitLife Owner: owner@fitlife-gym.com (sees all 3 branches)');
    console.log('- FitLife Staff1: staff11@fitlife-gym.com (Main + East branches)');

    console.log('\n✅ Comprehensive seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

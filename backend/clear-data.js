const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  console.log('🧹 Starting data cleanup...');
  
  try {
    // Delete in correct order to avoid foreign key constraints
    console.log('🗑️ Deleting member audit logs...');
    await prisma.memberAuditLog.deleteMany({});
    
    console.log('🗑️ Deleting platform revenue...');
    await prisma.platformRevenue.deleteMany({});
    
    console.log('🗑️ Deleting customer transactions...');
    await prisma.customerTransaction.deleteMany({});
    
    console.log('🗑️ Deleting SaaS subscriptions...');
    await prisma.saasSubscription.deleteMany({});
    
    console.log('🗑️ Deleting payments...');
    await prisma.payment.deleteMany({});
    
    console.log('🗑️ Deleting gym member subscriptions...');
    await prisma.gymMemberSubscription.deleteMany({});
    
    console.log('🗑️ Deleting user branch relationships...');
    await prisma.userBranch.deleteMany({});
    
    console.log('🗑️ Deleting subscriptions...');
    await prisma.subscription.deleteMany({});
    
    console.log('🗑️ Deleting membership plans...');
    await prisma.membershipPlan.deleteMany({});
    
    console.log('🗑️ Deleting branches...');
    await prisma.branch.deleteMany({});
    
    console.log('🗑️ Deleting business units...');
    await prisma.businessUnit.deleteMany({});
    
    console.log('🗑️ Deleting non-super-admin users...');
    await prisma.user.deleteMany({ where: { role: { not: 'SUPER_ADMIN' } } });
    
    console.log('🗑️ Deleting tenants...');
    await prisma.tenant.deleteMany({});
    
    console.log('🗑️ Deleting subscription plans...');
    await prisma.plan.deleteMany({});
    
    console.log('✅ All data cleared successfully!');
    console.log('📊 Database is now clean and ready for fresh seeding.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();

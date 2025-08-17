#!/usr/bin/env node

/**
 * Sync Base Data Script
 * 
 * This script creates the same base users (Super Admin, Owner) in both dev and prod databases
 * It does NOT sync customer/business data - only essential system users
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Database configurations
const databases = {
  dev: {
    host: 'localhost',
    port: 5433,
    database: 'creatives_saas_dev',
    user: 'postgres',
    password: 'dev_password_123'
  },
  prod: {
    host: 'localhost', 
    port: 5432,
    database: 'creatives_saas_prod',
    user: 'postgres',
    password: 'secure_prod_password_123'
  }
};

// Base users to sync (these are system users, not customer data)
const baseUsers = [
  {
    email: 'admin@creatives-saas.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    tenantId: null
  },
  {
    email: 'owner@muscle-mania.com',
    password: 'MuscleManiaOwner123!',
    firstName: 'Juan',
    lastName: 'Cruz', 
    name: 'Juan Cruz',
    role: 'OWNER',
    tenant: {
      name: 'Muscle Mania',
      slug: 'muscle-mania',
      category: 'GYM',
      address: '789 Muscle Road, Cebu City',
      email: 'info@muscle-mania.com',
      phoneNumber: '+63 32 987 6543'
    }
  }
];

async function syncDatabase(dbConfig, environment) {
  console.log(`\n🔄 Syncing ${environment} database...`);
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log(`✅ Connected to ${environment} database`);
    
    // Create users
    for (const userData of baseUsers) {
      await createUserWithTenant(client, userData, environment);
    }
    
    console.log(`✅ ${environment} database sync completed`);
    
  } catch (error) {
    console.error(`❌ Error syncing ${environment} database:`, error.message);
  } finally {
    await client.end();
  }
}

async function createUserWithTenant(client, userData, environment) {
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM "User" WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log(`⏭️  ${environment}: User ${userData.email} already exists`);
      return;
    }
    
    let tenantId = null;
    
    // Create tenant if user has tenant data
    if (userData.tenant) {
      // Check if tenant exists
      const existingTenant = await client.query(
        'SELECT id FROM "Tenant" WHERE slug = $1',
        [userData.tenant.slug]
      );
      
      if (existingTenant.rows.length > 0) {
        tenantId = existingTenant.rows[0].id;
        console.log(`⏭️  ${environment}: Tenant ${userData.tenant.name} already exists`);
      } else {
        // Create tenant
        tenantId = crypto.randomUUID();
        await client.query(`
          INSERT INTO "Tenant" (id, name, slug, category, address, email, "phoneNumber", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          tenantId,
          userData.tenant.name,
          userData.tenant.slug,
          userData.tenant.category,
          userData.tenant.address,
          userData.tenant.email,
          userData.tenant.phoneNumber
        ]);
        
        console.log(`✅ ${environment}: Created tenant ${userData.tenant.name}`);
      }
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const userId = crypto.randomUUID();
    
    await client.query(`
      INSERT INTO "User" (id, "tenantId", "firstName", "lastName", email, name, password, role, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
    `, [
      userId,
      tenantId,
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.name,
      hashedPassword,
      userData.role
    ]);
    
    console.log(`✅ ${environment}: Created user ${userData.email} (${userData.role})`);
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email} in ${environment}:`, error.message);
  }
}

async function main() {
  console.log('🌱 Starting base data sync...');
  console.log('📋 This will sync ONLY system users, not customer data');
  
  // Sync both databases
  await syncDatabase(databases.prod, 'production');
  await syncDatabase(databases.dev, 'development');
  
  console.log('\n🎉 Base data sync completed!');
  console.log('\n📋 Login Credentials:');
  console.log('==========================================');
  
  baseUsers.forEach(user => {
    console.log(`\n🏷️  ${user.role}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
  });
  
  console.log('\n==========================================');
  console.log('🚀 Both environments now have identical base users!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { syncDatabase, baseUsers };

#!/usr/bin/env npx ts-node
import { PrismaClient, BillingCycle } from '@prisma/client'
import { execSync } from 'child_process'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production database seeding...')

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'admin@creatives-saas.com' }
    })

    if (!existingSuperAdmin) {
      console.log('👑 Creating Super Admin...')
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10)
      
      await prisma.user.create({
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@creatives-saas.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      })
      console.log('✅ Super Admin created')
    } else {
      console.log('⏭️  Super Admin already exists: admin@creatives-saas.com')
    }

    // Create subscription plans
    console.log('📦 Creating subscription plans...')
    const plans = [
      { name: 'Free Trial', price: 0, billingCycle: BillingCycle.TRIAL, description: 'Free trial for 30 days' },
      { name: 'Monthly Pro', price: 2999, billingCycle: BillingCycle.MONTHLY, description: 'Monthly subscription' },
      { name: 'Annual Pro', price: 29999, billingCycle: BillingCycle.YEARLY, description: 'Annual subscription with discount' },
    ]

    for (const plan of plans) {
      const existing = await prisma.plan.findFirst({ where: { name: plan.name } })
      if (!existing) {
        await prisma.plan.create({ data: plan })
        console.log(`✅ Plan created: ${plan.name}`)
      } else {
        console.log(`⏭️  Plan already exists: ${plan.name}`)
      }
    }

    // Create Muscle Mania tenant
    console.log('🏢 Creating Muscle Mania tenant...')
    let muscleManiaProPlan = await prisma.plan.findFirst({ where: { name: 'Annual Pro' } })
    
    const existingTenant = await prisma.tenant.findFirst({
      where: { name: 'Muscle Mania' }
    })

    if (!existingTenant && muscleManiaProPlan) {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Muscle Mania',
          category: 'GYM',
          slug: 'muscle-mania',
          address: 'Manggahan, Pasig City',
          email: 'info@muscle-mania.com',
          phoneNumber: '+63 912 345 6789'
        }
      })

      // Create branch first, then subscription
      const branch = await prisma.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Manggahan',
          address: 'Manggahan, Pasig City',
          phoneNumber: '+63 912 345 6789',
          isActive: true
        }
      })
      
      // Create subscription for the branch
      await prisma.subscription.create({
        data: {
          branchId: branch.id,
          planId: muscleManiaProPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      })


      // Create owner account
      const ownerPassword = await bcrypt.hash('MuscleManiaOwner123!', 10)
      const owner = await prisma.user.create({
        data: {
          firstName: 'Mark',
          lastName: 'Owner',
          email: 'owner@muscle-mania.com',
          password: ownerPassword,
          role: 'OWNER',
          tenantId: tenant.id,
          isActive: true
        }
      })

      // Give owner access to all branches
      await prisma.userBranch.create({
        data: {
          userId: owner.id,
          branchId: branch.id,
          accessLevel: 'FULL_ACCESS'
        }
      })

      console.log('✅ Muscle Mania tenant created with owner')
    } else {
      console.log('⏭️  Tenant already exists: Muscle Mania')
    }

    console.log('🎉 Production database seeding completed!')
    console.log('')
    console.log('📋 Login Credentials:')
    console.log('================================================================================')
    console.log('')
    console.log('🏷️  SUPER_ADMINS:')
    console.log('   Name: Super Admin')
    console.log('   Email: admin@creatives-saas.com')
    console.log('   Password: SuperAdmin123!')
    console.log('   ---')
    console.log('')
    console.log('🏷️  OWNERS:')
    console.log('   Name: Mark Owner (Muscle Mania)')
    console.log('   Email: owner@muscle-mania.com')
    console.log('   Password: MuscleManiaOwner123!')
    console.log('')
    console.log('================================================================================')
    console.log('📊 Summary:')
    console.log('   • 1 Tenant: Muscle Mania')
    console.log('   • 1 Branch: Manggahan')
    console.log('   • Ready for production use')
    console.log('🚀 You can now login with these credentials!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the main function
main()
  .then(async () => {
    console.log('\n🌱  The seed command has been executed.')
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

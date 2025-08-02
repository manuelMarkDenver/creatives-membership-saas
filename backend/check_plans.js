const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()

  try {
    // Check existing plans
    const plans = await prisma.plan.findMany()
    console.log('Existing plans:', JSON.stringify(plans, null, 2))

    if (plans.length === 0) {
      console.log('No plans found. Creating default plans...')
      
      const defaultPlans = [
        {
          name: 'Basic',
          price: 19.99,
          billingCycle: 'MONTHLY',
          description: 'Perfect for small gyms getting started',
          isActive: true,
        },
        {
          name: 'Pro',
          price: 49.99,
          billingCycle: 'MONTHLY',
          description: 'Ideal for growing fitness businesses',
          isActive: true,
        },
        {
          name: 'Enterprise',
          price: 99.99,
          billingCycle: 'MONTHLY',
          description: 'For large chains and franchises',
          isActive: true,
        },
        {
          name: 'Basic Annual',
          price: 199.99,
          billingCycle: 'YEARLY',
          description: 'Basic plan with annual billing',
          isActive: true,
        },
        {
          name: 'Pro Annual',
          price: 499.99,
          billingCycle: 'YEARLY',
          description: 'Pro plan with annual billing',
          isActive: true,
        },
        {
          name: 'Enterprise Annual',
          price: 999.99,
          billingCycle: 'YEARLY',
          description: 'Enterprise plan with annual billing',
          isActive: true,
        }
      ]

      for (const planData of defaultPlans) {
        const plan = await prisma.plan.create({
          data: planData
        })
        console.log('Created plan:', plan.name)
      }
      
      console.log('Default plans created successfully!')
      
      // Show all plans now
      const newPlans = await prisma.plan.findMany()
      console.log('All plans now:', JSON.stringify(newPlans, null, 2))
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

#!/usr/bin/env node
/**
 * Debug script to check expiring members data
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking expiring members data...\n')
    
    // Check the specific members mentioned - show ALL subscriptions
    const targetEmails = [
      'lisa8b1@muscle-mania.com',
      'anthony23b1@muscle-mania.com', 
      'stephanie20b1@muscle-mania.com',
      'daniel15b1@muscle-mania.com'
    ]
    
    console.log('=== CHECKING USERS ===')
    for (const email of targetEmails) {
      const user = await prisma.user.findFirst({
        where: { email },
        include: {
          customerSubscriptions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
      
      if (user) {
        console.log(`\n👤 ${email}:`)
        console.log(`   User Active: ${user.isActive}`)
        console.log(`   User Deleted: ${user.deletedAt}`)
        console.log(`   Total Subscriptions: ${user.customerSubscriptions?.length || 0}`)
        
        if (user.customerSubscriptions?.length) {
          user.customerSubscriptions.forEach((subscription, index) => {
            console.log(`\n   📋 Subscription ${index + 1} (${index === 0 ? 'MOST RECENT' : 'older'}):`)
            console.log(`      ID: ${subscription.id}`)
            console.log(`      Status: ${subscription.status}`)
            console.log(`      Start Date: ${subscription.startDate}`)
            console.log(`      End Date: ${subscription.endDate}`)
            console.log(`      Cancelled: ${subscription.cancelledAt}`)
            console.log(`      Created: ${subscription.createdAt}`)
            
            // Calculate days
            const now = new Date()
            const endDate = new Date(subscription.endDate)
            const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            console.log(`      Days Until Expiry: ${daysUntilExpiry}`)
            
            // Check if it would be included in expiring query
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + 7)
            
            const wouldBeIncluded = (
              subscription.status === 'ACTIVE' &&
              !subscription.cancelledAt &&
              endDate > now &&
              endDate <= targetDate &&
              !user.deletedAt &&
              user.isActive
            )
            
            console.log(`      Would be in expiring list: ${wouldBeIncluded}`)
          })
        } else {
          console.log(`   ❌ No subscriptions`)
        }
      } else {
        console.log(`\n❌ User ${email} not found`)
      }
    }
    
    console.log('\n=== CURRENT EXPIRING QUERY ===')
    
    const currentDate = new Date()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 7)
    
    console.log(`Current Date: ${currentDate.toISOString()}`)
    console.log(`Target Date: ${targetDate.toISOString()}`)
    
    const expiringSubscriptions = await prisma.customerSubscription.findMany({
      where: {
        status: 'ACTIVE',
        cancelledAt: null,
        endDate: {
          gt: currentDate,  // Must be in the future (not expired)
          lte: targetDate   // But within the expiring window
        },
        customer: {
          deletedAt: null,
          isActive: true
        }
      },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            deletedAt: true
          }
        }
      },
      orderBy: { endDate: 'asc' }
    })
    
    console.log(`\n📊 Current expiring query finds: ${expiringSubscriptions.length} subscriptions`)
    expiringSubscriptions.forEach((sub, idx) => {
      const daysUntilExpiry = Math.ceil((new Date(sub.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`   ${idx + 1}. ${sub.customer.email} - ${daysUntilExpiry} days (End: ${sub.endDate})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

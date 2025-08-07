#!/usr/bin/env node

// Scheduled task runner for pickup notifications
// This script should be run via cron jobs or similar scheduling system

import { pickupScheduler } from '../src/lib/pickup-scheduler.js'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  console.log(`🚀 Starting pickup notification scheduler: ${command}`)
  console.log(`📅 Current time: ${new Date().toISOString()}`)

  try {
    switch (command) {
      case 'h1-reminders':
        console.log('📤 Sending H-1 pickup reminders...')
        await pickupScheduler.sendH1PickupReminders()
        break

      case 'today-reminders':
        console.log('📤 Sending today pickup reminders...')
        await pickupScheduler.sendTodayPickupReminders()
        break

      case 'date-reminders':
        const targetDate = args[1]
        if (!targetDate) {
          console.error('❌ Target date is required for date-reminders command')
          console.log('Usage: node pickup-scheduler.js date-reminders YYYY-MM-DD')
          process.exit(1)
        }
        console.log(`📤 Sending pickup reminders for date: ${targetDate}`)
        await pickupScheduler.sendPickupRemindersForDate(new Date(targetDate))
        break

      default:
        console.log('Available commands:')
        console.log('  h1-reminders     - Send H-1 pickup reminders')
        console.log('  today-reminders  - Send today pickup reminders')
        console.log('  date-reminders YYYY-MM-DD - Send reminders for specific date')
        console.log('')
        console.log('Examples:')
        console.log('  node pickup-scheduler.js h1-reminders')
        console.log('  node pickup-scheduler.js today-reminders')
        console.log('  node pickup-scheduler.js date-reminders 2025-09-05')
        process.exit(1)
    }

    console.log('✅ Pickup notification scheduler completed successfully')
  } catch (error) {
    console.error('❌ Error in pickup notification scheduler:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📯 Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n📯 Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

main().catch((error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

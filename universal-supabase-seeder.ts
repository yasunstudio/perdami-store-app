#!/usr/bin/env node

/**
 * Universal Supabase Seeder
 * 
 * Usage:
 *   npx tsx universal-supabase-seeder.ts banks
 *   npx tsx universal-supabase-seeder.ts appsettings  
 *   npx tsx universal-supabase-seeder.ts all
 */

import { DirectSupabaseClient, seedBanksDirectly } from './direct-supabase-seeder'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

interface AppSettingsData {
  id: string
  key: string
  value: string
  description: string | null
  category: string
  isPublic: boolean
}

// App Settings data
const APP_SETTINGS_DATA: AppSettingsData[] = [
  {
    id: 'setting-single-bank-mode',
    key: 'singleBankMode',
    value: 'false',
    description: 'Enable single bank mode for simplified payments',
    category: 'payment',
    isPublic: true
  },
  {
    id: 'setting-default-bank',
    key: 'defaultBankCode',
    value: 'BRI',
    description: 'Default bank when single bank mode is enabled',
    category: 'payment',
    isPublic: true
  },
  {
    id: 'setting-payment-due-days',
    key: 'paymentDueDays',
    value: '3',
    description: 'Number of days for payment due',
    category: 'payment',
    isPublic: true
  },
  {
    id: 'setting-auto-reminder',
    key: 'autoPaymentReminder',
    value: 'true',
    description: 'Send automatic payment reminders',
    category: 'notification',
    isPublic: false
  }
]

/**
 * Extended DirectSupabaseClient for AppSettings
 */
class ExtendedSupabaseClient extends DirectSupabaseClient {
  static async createAppSettingsTable(): Promise<void> {
    return this.execute(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "AppSettings" (
          id TEXT PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL DEFAULT 'general',
          "isPublic" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      await client.query(`CREATE INDEX IF NOT EXISTS "AppSettings_key_idx" ON "AppSettings"(key)`)
      await client.query(`CREATE INDEX IF NOT EXISTS "AppSettings_category_idx" ON "AppSettings"(category)`)
    })
  }

  static async upsertAppSetting(setting: AppSettingsData): Promise<void> {
    return this.execute(async (client) => {
      await client.query(
        `INSERT INTO "AppSettings" (id, key, value, description, category, "isPublic", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (id) 
         DO UPDATE SET
           key = EXCLUDED.key,
           value = EXCLUDED.value,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           "isPublic" = EXCLUDED."isPublic",
           "updatedAt" = NOW()`,
        [setting.id, setting.key, setting.value, setting.description, setting.category, setting.isPublic]
      )
    })
  }

  static async getAllAppSettings(): Promise<AppSettingsData[]> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT id, key, value, description, category, "isPublic"
         FROM "AppSettings" 
         ORDER BY category, key`
      )
      return result.rows
    })
  }
}

async function seedAppSettings(): Promise<void> {
  console.log('⚙️  SEEDING APP SETTINGS')
  console.log('========================')

  try {
    // Check if table exists
    const tableExists = await DirectSupabaseClient.checkTableExists('AppSettings')
    
    if (!tableExists) {
      console.log('🏗️  Creating AppSettings table...')
      await ExtendedSupabaseClient.createAppSettingsTable()
      console.log('✅ AppSettings table created')
    } else {
      console.log('✅ AppSettings table already exists')
    }

    // Insert settings
    console.log('\n💾 Inserting app settings...')
    let successCount = 0
    
    for (const setting of APP_SETTINGS_DATA) {
      try {
        await ExtendedSupabaseClient.upsertAppSetting(setting)
        console.log(`✅ Upserted: ${setting.key} (${setting.category})`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Failed to upsert ${setting.key}:`, error.message)
      }
    }

    console.log(`\n📊 Summary: ${successCount}/${APP_SETTINGS_DATA.length} settings processed`)

    // Verify
    const allSettings = await ExtendedSupabaseClient.getAllAppSettings()
    console.log(`\n⚙️  All Settings in Database (${allSettings.length} total):`)
    
    const categories = [...new Set(allSettings.map(s => s.category))]
    categories.forEach(category => {
      console.log(`\n📁 ${category.toUpperCase()}:`)
      allSettings
        .filter(s => s.category === category)
        .forEach(setting => {
          const visibility = setting.isPublic ? '🟢 Public' : '🔴 Private'
          console.log(`   ${setting.key}: "${setting.value}" - ${visibility}`)
          if (setting.description) {
            console.log(`      💬 ${setting.description}`)
          }
        })
    })

  } catch (error: any) {
    console.error('\n❌ App settings seeding failed:', error.message)
    throw error
  }
}

async function seedAll(): Promise<void> {
  console.log('🌱 UNIVERSAL SUPABASE SEEDING')
  console.log('==============================')
  console.log('Seeding all data types...\n')

  try {
    // Seed banks
    await seedBanksDirectly()
    
    console.log('\n' + '='.repeat(50) + '\n')
    
    // Seed app settings
    await seedAppSettings()
    
    console.log('\n🎉 ALL SEEDING COMPLETED!')
    console.log('=========================')
    console.log('✅ Banks: Ready for payment processing')
    console.log('✅ AppSettings: System configuration ready')
    
  } catch (error: any) {
    console.error('\n💥 UNIVERSAL SEEDING FAILED!')
    console.error('============================')
    console.error('Error:', error.message)
    throw error
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] || 'help'
  const startTime = Date.now()

  try {
    switch (command) {
      case 'banks':
        await seedBanksDirectly()
        break
        
      case 'appsettings':
      case 'settings':
        await seedAppSettings()
        break
        
      case 'all':
        await seedAll()
        break
        
      case 'help':
      default:
        console.log('🌱 UNIVERSAL SUPABASE SEEDER')
        console.log('============================')
        console.log('')
        console.log('Usage:')
        console.log('  npx tsx universal-supabase-seeder.ts banks      # Seed bank data')
        console.log('  npx tsx universal-supabase-seeder.ts settings   # Seed app settings')
        console.log('  npx tsx universal-supabase-seeder.ts all        # Seed everything')
        console.log('')
        console.log('Available commands:')
        console.log('  banks       - Seed bank accounts for payment processing')
        console.log('  appsettings - Seed application configuration settings')
        console.log('  all         - Seed all data types')
        console.log('  help        - Show this help message')
        console.log('')
        console.log('Environment:')
        console.log('  Requires DATABASE_URL in .env.local')
        console.log('  Bypasses Prisma to avoid prepared statement conflicts')
        return
    }

    const duration = Date.now() - startTime
    console.log(`\n⏱️  Total Duration: ${duration}ms`)
    console.log('✅ Seeding completed successfully!')
    
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`\n💥 SEEDING FAILED! (${duration}ms)`)
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check DATABASE_URL in .env.local')
    console.error('2. Verify Supabase connection is active')
    console.error('3. Ensure no concurrent Prisma operations')
    process.exit(1)
  }
}

// Export for use in other scripts
export { ExtendedSupabaseClient, seedAppSettings, seedAll }

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

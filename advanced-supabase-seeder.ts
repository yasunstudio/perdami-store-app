import SupabasePrismaClient, { supabaseDB } from './src/lib/supabase-prisma-client'

/**
 * Advanced Bank Seeder untuk Supabase + Vercel
 * Mengatasi prepared statement conflicts dengan isolation strategy
 */

interface BankData {
  id: string
  name: string
  code: string
  accountNumber: string
  accountName: string
  logo: string | null
  isActive: boolean
}

interface AppSettingsData {
  id: string
  appName: string
  appDescription: string
  singleBankMode: boolean
  isActive: boolean
}

const BANK_DATA: BankData[] = [
  {
    id: 'bank-bri-perdami',
    name: 'Bank BRI - Perdami Store',
    code: 'BRI',
    accountNumber: '1234567890123456',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bri-logo.png',
    isActive: true,
  },
  {
    id: 'bank-bca-perdami',
    name: 'Bank BCA - Perdami Store',
    code: 'BCA',
    accountNumber: '9876543210987654',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bca-logo.png',
    isActive: true,
  },
  {
    id: 'bank-mandiri-perdami',
    name: 'Bank Mandiri - Perdami Store',
    code: 'MANDIRI',
    accountNumber: '5556667778889999',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/mandiri-logo.png',
    isActive: true,
  },
  {
    id: 'bank-bni-perdami',
    name: 'Bank BNI - Perdami Store',
    code: 'BNI',
    accountNumber: '1112223334445555',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bni-logo.png',
    isActive: false,
  }
]

const APP_SETTINGS_DATA: AppSettingsData = {
  id: 'main-config',
  appName: 'Perdami Store',
  appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
  singleBankMode: false, // Multiple banks enabled
  isActive: true
}

/**
 * Bank Table Schema
 */
const BANK_TABLE_SCHEMA = `(
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  logo TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

/**
 * AppSettings Table Schema  
 */
const APPSETTINGS_TABLE_SCHEMA = `(
  id TEXT PRIMARY KEY,
  "appName" TEXT NOT NULL DEFAULT 'Perdami Store',
  "appDescription" TEXT NOT NULL DEFAULT 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
  "appLogo" TEXT DEFAULT '/images/logo.png',
  "businessAddress" TEXT DEFAULT 'Venue PIT PERDAMI 2025, Bandung, Jawa Barat',
  "pickupLocation" TEXT DEFAULT 'Venue PIT PERDAMI 2025',
  "pickupCity" TEXT DEFAULT 'Bandung, Jawa Barat',
  "eventName" TEXT DEFAULT 'PIT PERDAMI 2025',
  "eventYear" TEXT DEFAULT '2025',
  "copyrightText" TEXT DEFAULT '© 2025 Perdami Store. Dibuat khusus untuk PIT PERDAMI 2025.',
  "copyrightSubtext" TEXT DEFAULT 'Semua hak cipta dilindungi.',
  "isMaintenanceMode" BOOLEAN DEFAULT false,
  "maintenanceMessage" TEXT,
  "singleBankMode" BOOLEAN DEFAULT false,
  "defaultBankId" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)`

async function seedBanks(): Promise<void> {
  console.log('🏦 SEEDING BANKS WITH ADVANCED PRISMA CLIENT')
  console.log('===========================================')
  
  try {
    // 1. Check and create Bank table if needed
    console.log('🔍 Checking Bank table...')
    const bankTableExists = await supabaseDB.tableExists('Bank')
    
    if (!bankTableExists) {
      console.log('🏗️  Creating Bank table...')
      await supabaseDB.createTableIfNotExists('Bank', BANK_TABLE_SCHEMA)
      
      // Create indexes
      await SupabasePrismaClient.executeRawSQL(`
        CREATE INDEX IF NOT EXISTS "Bank_code_idx" ON "Bank"(code)
      `)
      await SupabasePrismaClient.executeRawSQL(`
        CREATE INDEX IF NOT EXISTS "Bank_isActive_idx" ON "Bank"("isActive")
      `)
      console.log('✅ Bank table and indexes created')
    } else {
      console.log('✅ Bank table already exists')
    }

    // 2. Insert/update bank data using bulk upsert
    console.log('💾 Upserting bank data...')
    const results = await supabaseDB.bulkUpsert<BankData>('Bank', BANK_DATA)
    
    console.log(`📊 Successfully processed ${results.length}/${BANK_DATA.length} banks`)

    // 3. Verify results
    console.log('🔍 Verifying bank data...')
    const allBanks = await SupabasePrismaClient.queryRawSQL<BankData>(`
      SELECT id, name, code, "accountNumber", "accountName", "isActive"
      FROM "Bank" 
      ORDER BY name
    `)

    console.log(`\n🏦 Banks in Database (${allBanks.length} total):`)
    allBanks.forEach((bank: any, index: number) => {
      const status = bank.isActive ? '🟢 Active' : '🔴 Inactive'
      console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${status}`)
      console.log(`      Account: ${bank.accountNumber} | ${bank.accountName}`)
    })

    const activeBanks = allBanks.filter((bank: any) => bank.isActive)
    console.log(`\n✨ ${activeBanks.length} active banks ready!`)

  } catch (error: any) {
    console.error('❌ Bank seeding failed:', error.message)
    throw error
  }
}

async function seedAppSettings(): Promise<void> {
  console.log('\n⚙️  SEEDING APP SETTINGS')
  console.log('=======================')
  
  try {
    // 1. Check and create AppSettings table if needed
    const settingsTableExists = await supabaseDB.tableExists('AppSettings')
    
    if (!settingsTableExists) {
      console.log('🏗️  Creating AppSettings table...')
      await supabaseDB.createTableIfNotExists('AppSettings', APPSETTINGS_TABLE_SCHEMA)
      console.log('✅ AppSettings table created')
    } else {
      console.log('✅ AppSettings table already exists')
    }

    // 2. Upsert app settings
    console.log('💾 Upserting app settings...')
    const settingsData = {
      ...APP_SETTINGS_DATA,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await supabaseDB.upsert<AppSettingsData>('AppSettings', settingsData)
    
    console.log('✅ App settings configured:')
    console.log(`   App Name: ${result.appName}`)
    console.log(`   Single Bank Mode: ${result.singleBankMode ? 'Enabled' : 'Disabled (Multiple Banks)'}`)

  } catch (error: any) {
    console.error('❌ AppSettings seeding failed:', error.message)
    // Non-critical, continue
  }
}

async function validateSeeding(): Promise<void> {
  console.log('\n🔍 VALIDATION')
  console.log('=============')
  
  try {
    // Test API-like query to ensure it works
    const bankCount = await SupabasePrismaClient.queryRawSQL(`
      SELECT COUNT(*) as count FROM "Bank" WHERE "isActive" = true
    `)
    
    const settingsCount = await SupabasePrismaClient.queryRawSQL(`
      SELECT COUNT(*) as count FROM "AppSettings" WHERE "isActive" = true
    `)

    console.log(`📊 Validation Results:`)
    console.log(`   Active Banks: ${bankCount[0]?.count || 0}`)
    console.log(`   App Settings: ${settingsCount[0]?.count || 0}`)
    
    if (Number(bankCount[0]?.count) >= 3) {
      console.log('✅ Bank seeding validation passed')
    } else {
      console.log('⚠️  Bank seeding validation: fewer banks than expected')
    }

  } catch (error: any) {
    console.error('❌ Validation failed:', error.message)
  }
}

async function main(): Promise<void> {
  console.log('🌱 ADVANCED SUPABASE DATABASE SEEDING')
  console.log('=====================================')
  console.log('Using conflict-resistant Prisma client for Supabase + Vercel\n')

  const startTime = Date.now()
  
  try {
    await seedBanks()
    await seedAppSettings()
    await validateSeeding()

    const duration = Date.now() - startTime
    console.log(`\n🎉 SEEDING COMPLETED SUCCESSFULLY!`)
    console.log('==================================')
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log('✅ Bank data ready in database')
    console.log('✅ App settings configured')
    console.log('✅ Prepared statement conflicts handled')
    
    console.log('\n💡 Next Steps:')
    console.log('1. Test API: curl https://dharma-wanita-perdami.vercel.app/api/banks')
    console.log('2. Banks should now load from database instead of static data')
    console.log('3. You can run this script anytime to refresh/update data')

  } catch (error: any) {
    console.error('\n💥 SEEDING FAILED!')
    console.error('==================')
    console.error('Error:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Check DATABASE_URL in environment')
    console.error('2. Verify Supabase connection is active')
    console.error('3. Check if pgbouncer settings allow multiple connections')
    
    process.exit(1)
  } finally {
    // Cleanup
    await SupabasePrismaClient.cleanup()
  }
}

// Export untuk bisa digunakan di script lain
export { seedBanks, seedAppSettings, validateSeeding }

// Run jika dipanggil langsung
if (require.main === module) {
  main().catch(console.error)
}

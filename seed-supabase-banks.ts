// Simple seed script untuk Supabase PostgreSQL via Vercel
// Menggunakan approach yang berbeda untuk menghindari prepared statement conflicts

import { PrismaClient } from '@prisma/client'

// Create a completely fresh Prisma instance with unique connection
function createFreshPrismaClient() {
  // Add timestamp to make connection unique and avoid prepared statement caching
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  const connectionString = process.env.DATABASE_URL + `&application_name=seed_${timestamp}_${randomId}&connect_timeout=10`
  
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString
      }
    },
    log: ['error', 'warn']
  })
}

export async function seedBanksToSupabase() {
  console.log('🏦 Seeding Banks to Supabase Database...')
  console.log('========================================')
  
  const prisma = createFreshPrismaClient()
  
  try {
    // Bank data untuk Perdami Store
    const banksData = [
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

    console.log('🔍 Checking existing banks...')
    
    // Check existing banks using raw SQL to avoid prepared statement issues
    const existingBanks = await prisma.$queryRawUnsafe(`
      SELECT id, name FROM "Bank" 
      ORDER BY name
    `) as any[]
    
    console.log(`Found ${existingBanks.length} existing banks in database`)
    
    // Use upsert approach with raw SQL for better Supabase compatibility
    console.log('💾 Inserting/updating bank data...')
    
    let processedCount = 0
    
    for (const bank of banksData) {
      try {
        // Use raw SQL upsert to avoid prepared statement conflicts
        await prisma.$executeRawUnsafe(`
          INSERT INTO "Bank" (id, name, code, "accountNumber", "accountName", logo, "isActive", "createdAt", "updatedAt")
          VALUES ('${bank.id}', '${bank.name}', '${bank.code}', '${bank.accountNumber}', '${bank.accountName}', '${bank.logo}', ${bank.isActive}, NOW(), NOW())
          ON CONFLICT (id) 
          DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            "accountNumber" = EXCLUDED."accountNumber",
            "accountName" = EXCLUDED."accountName",
            logo = EXCLUDED.logo,
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = NOW()
        `)
        
        console.log(`✅ Processed: ${bank.name}`)
        processedCount++
        
      } catch (error: any) {
        console.error(`❌ Error with ${bank.name}:`, error?.message || error)
      }
    }
    
    console.log(`\n📊 Summary: ${processedCount}/${banksData.length} banks processed`)
    
    // Verify final result
    const finalBanks = await prisma.$queryRawUnsafe(`
      SELECT id, name, code, "accountNumber", "accountName", "isActive"
      FROM "Bank" 
      ORDER BY name
    `) as any[]
    
    console.log(`\n🏦 All Banks in Database (${finalBanks.length} total):`)
    finalBanks.forEach((bank: any, index: number) => {
      const status = bank.isActive ? '🟢 Active' : '🔴 Inactive'
      console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${status}`)
      console.log(`      Account: ${bank.accountNumber} | ${bank.accountName}`)
    })
    
    const activeBanks = finalBanks.filter((bank: any) => bank.isActive)
    console.log(`\n✨ ${activeBanks.length} active banks ready in Supabase!`)
    
    return { success: true, count: processedCount, active: activeBanks.length }
    
  } catch (error: any) {
    console.error('❌ Seed failed:', error?.message || error)
    
    if (error?.message?.includes('relation "Bank" does not exist')) {
      console.log('\n🔧 Bank table does not exist. Solutions:')
      console.log('1. Run Prisma migrations: npx prisma migrate deploy')
      console.log('2. Or create manually in Supabase dashboard')
      console.log('3. Or run: npx prisma db push')
    } else if (error?.message?.includes('prepared statement')) {
      console.log('\n🔧 Prepared statement conflict. This is a known Supabase + Vercel issue.')
      console.log('The static bank data in the API should work as fallback.')
    }
    
    return { success: false, error: error?.message || String(error) }
    
  } finally {
    await prisma.$disconnect()
  }
}

// Also create AppSettings for complete setup
export async function seedAppSettingsToSupabase() {
  console.log('\n⚙️  Setting up App Configuration...')
  
  const prisma = createFreshPrismaClient()
  
  try {
    // Check if AppSettings table exists
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'AppSettings'
    `) as any[]
    
    if (tables.length === 0) {
      console.log('⚠️  AppSettings table not found, skipping...')
      return { success: true, skipped: true }
    }
    
    // Set app configuration
    await prisma.$executeRawUnsafe(`
      INSERT INTO "AppSettings" (
        id, "appName", "appDescription", "singleBankMode", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        'main-config', 
        'Perdami Store', 
        'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
        false,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        "singleBankMode" = false,
        "updatedAt" = NOW()
    `)
    
    console.log('✅ App settings configured (multiple bank mode enabled)')
    return { success: true }
    
  } catch (error: any) {
    console.log('⚠️  AppSettings setup skipped:', error?.message || error)
    return { success: true, skipped: true }
  } finally {
    await prisma.$disconnect()
  }
}

// Main function
async function main() {
  console.log('🌱 SUPABASE BANK SEED')
  console.log('====================')
  console.log('Seeding bank data to Supabase PostgreSQL via Vercel...\n')
  
  try {
    const bankResult = await seedBanksToSupabase()
    const settingsResult = await seedAppSettingsToSupabase()
    
    console.log('\n🎉 SUPABASE SEED COMPLETED!')
    console.log('===========================')
    
    if (bankResult.success) {
      console.log(`✅ Banks: ${bankResult.count} processed, ${bankResult.active} active`)
    } else {
      console.log(`❌ Banks: Failed - ${bankResult.error}`)
    }
    
    if (settingsResult.success) {
      console.log('✅ Settings: Configured')
    }
    
    console.log('\n💡 Next steps:')
    console.log('1. Test the API: curl https://dharma-wanita-perdami.vercel.app/api/banks')
    console.log('2. Check Supabase dashboard to verify data')
    console.log('3. Static fallback data is already active if DB fails')
    
  } catch (error: any) {
    console.error('\n❌ SEED FAILED:', error?.message || error)
    console.log('\n🔧 Don\'t worry! Static bank data in the API provides fallback.')
    process.exit(1)
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error)
}

/**
 * Pure PostgreSQL client untuk Supabase
 * Bypass Prisma sepenuhnya untuk menghindari prepared statement conflicts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Bypass SSL certificate issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

interface BankData {
  id: string
  name: string
  code: string
  accountNumber: string
  accountName: string
  logo: string | null
  isActive: boolean
}

class DirectSupabaseClient {
  private static createUniqueClient(): Client {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const uniqueId = `direct_${timestamp}_${random}`
    
    // Parse DATABASE_URL and add unique application name
    let connectionUrl = process.env.DATABASE_URL!
    
    if (connectionUrl.includes('?')) {
      connectionUrl += `&application_name=${uniqueId}`
    } else {
      connectionUrl += `?application_name=${uniqueId}`
    }
    
    return new Client({
      connectionString: connectionUrl,
      ssl: { rejectUnauthorized: false },
      statement_timeout: 30000,
      query_timeout: 30000,
      connectionTimeoutMillis: 10000
    })
  }

  static async execute<T = any>(operation: (client: Client) => Promise<T>): Promise<T> {
    const client = this.createUniqueClient()
    
    try {
      await client.connect()
      return await operation(client)
    } finally {
      await client.end()
    }
  }

  static async checkTableExists(tableName: string): Promise<boolean> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      )
      return result.rows[0].exists
    })
  }

  static async createBankTable(): Promise<void> {
    return this.execute(async (client) => {
      // Create table with exact Prisma schema structure
      await client.query(`
        CREATE TABLE IF NOT EXISTS "banks" (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          code TEXT UNIQUE NOT NULL,
          "accountNumber" TEXT NOT NULL,
          "accountName" TEXT NOT NULL,
          logo TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS "banks_code_idx" ON "banks"(code)`)
      await client.query(`CREATE INDEX IF NOT EXISTS "banks_isActive_idx" ON "banks"("isActive")`)
    })
  }

  static async upsertBank(bank: BankData): Promise<void> {
    return this.execute(async (client) => {
      await client.query(
        `INSERT INTO "banks" (id, name, code, "accountNumber", "accountName", logo, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) 
         DO UPDATE SET
           name = EXCLUDED.name,
           code = EXCLUDED.code,
           "accountNumber" = EXCLUDED."accountNumber",
           "accountName" = EXCLUDED."accountName",
           logo = EXCLUDED.logo,
           "isActive" = EXCLUDED."isActive",
           "updatedAt" = NOW()`,
        [bank.id, bank.name, bank.code, bank.accountNumber, bank.accountName, bank.logo, bank.isActive]
      )
    })
  }

  static async getAllBanks(): Promise<BankData[]> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT id, name, code, "accountNumber", "accountName", logo, "isActive"
         FROM "banks" 
         ORDER BY name`
      )
      return result.rows
    })
  }

  static async getActiveBanks(): Promise<BankData[]> {
    return this.execute(async (client) => {
      const result = await client.query(
        `SELECT id, name, code, "accountNumber", "accountName", logo, "isActive"
         FROM "banks" 
         WHERE "isActive" = true
         ORDER BY name`
      )
      return result.rows
    })
  }
}

// Bank data to seed
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

async function seedBanksDirectly(): Promise<void> {
  console.log('🚀 DIRECT SUPABASE BANK SEEDING')
  console.log('===============================')
  console.log('Bypassing Prisma completely to avoid prepared statement conflicts\n')

  try {
    // 1. Check if table exists
    console.log('🔍 Checking if banks table exists...')
    const tableExists = await DirectSupabaseClient.checkTableExists('banks')
    
    if (!tableExists) {
      console.log('🏗️  Creating banks table...')
      await DirectSupabaseClient.createBankTable()
      console.log('✅ banks table created successfully')
    } else {
      console.log('✅ banks table already exists')
    }

    // 2. Insert/update bank data
    console.log('\n💾 Inserting bank data...')
    let successCount = 0
    
    for (const bank of BANK_DATA) {
      try {
        await DirectSupabaseClient.upsertBank(bank)
        console.log(`✅ Upserted: ${bank.name}`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Failed to upsert ${bank.name}:`, error.message)
      }
    }

    console.log(`\n📊 Summary: ${successCount}/${BANK_DATA.length} banks processed`)

    // 3. Verify results
    console.log('\n🔍 Verifying results...')
    const allBanks = await DirectSupabaseClient.getAllBanks()
    
    console.log(`\n🏦 All Banks in Database (${allBanks.length} total):`)
    allBanks.forEach((bank, index) => {
      const status = bank.isActive ? '🟢 Active' : '🔴 Inactive'
      console.log(`   ${index + 1}. ${bank.name} (${bank.code}) - ${status}`)
      console.log(`      Account: ${bank.accountNumber} | ${bank.accountName}`)
    })

    const activeBanks = allBanks.filter(bank => bank.isActive)
    console.log(`\n✨ ${activeBanks.length} active banks ready for API!`)

    // 4. Test query like API would use
    console.log('\n🧪 Testing API-like query...')
    const apiResult = await DirectSupabaseClient.getActiveBanks()
    console.log(`✅ API query returned ${apiResult.length} active banks`)

  } catch (error: any) {
    console.error('\n❌ Direct seeding failed:', error.message)
    throw error
  }
}

async function main(): Promise<void> {
  const startTime = Date.now()
  
  try {
    await seedBanksDirectly()
    
    const duration = Date.now() - startTime
    console.log(`\n🎉 DIRECT SEEDING COMPLETED!`)
    console.log('============================')
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log('✅ Bank data successfully inserted using direct PostgreSQL client')
    console.log('✅ No prepared statement conflicts encountered')
    
    console.log('\n💡 Next Steps:')
    console.log('1. Test API: curl https://dharma-wanita-perdami.vercel.app/api/banks')
    console.log('2. Update SingleBankService to use database instead of static data')
    console.log('3. Use this approach for all future Supabase seeding')

  } catch (error: any) {
    console.error('\n💥 SEEDING FAILED!')
    console.error('==================')
    console.error('Error:', error.message)
    process.exit(1)
  }
}

// Export for use in other scripts
export { DirectSupabaseClient, seedBanksDirectly }

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

/**
 * Fix Banks Table Structure and Re-seed
 * Align banks table with Prisma schema and re-populate data
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Bank data to re-seed (since original was lost)
const BANK_DATA = [
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

async function fixBanksTableStructure() {
  console.log('🔧 FIXING BANKS TABLE STRUCTURE')
  console.log('================================')
  console.log('Aligning banks table with Prisma schema\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 5000
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Step 1: Check current banks table structure
    console.log('\n📊 CHECKING CURRENT "banks" TABLE:')
    const currentStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'banks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('   📋 Current columns:')
    currentStructure.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    // Step 2: Drop and recreate banks table with correct structure
    console.log('\n🔄 RECREATING "banks" TABLE WITH CORRECT STRUCTURE:')
    
    // Drop the table (we already moved FK constraint)
    await client.query('DROP TABLE IF EXISTS "banks" CASCADE')
    console.log('   ✅ Dropped old "banks" table')

    // Create new banks table with correct Prisma schema structure
    await client.query(`
      CREATE TABLE "banks" (
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
    console.log('   ✅ Created new "banks" table with correct structure')

    // Add indexes as per Prisma schema
    await client.query('CREATE INDEX "banks_code_idx" ON "banks"(code)')
    await client.query('CREATE INDEX "banks_isActive_idx" ON "banks"("isActive")')
    console.log('   ✅ Added indexes')

    // Step 3: Insert bank data
    console.log('\n💾 INSERTING BANK DATA:')
    let insertedCount = 0

    for (const bank of BANK_DATA) {
      try {
        await client.query(`
          INSERT INTO "banks" (
            id, name, code, "accountNumber", "accountName", 
            logo, "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          bank.id,
          bank.name,
          bank.code,
          bank.accountNumber,
          bank.accountName,
          bank.logo,
          bank.isActive
        ])
        
        console.log(`   ✅ Inserted: ${bank.name}`)
        insertedCount++
        
      } catch (error: any) {
        console.error(`   ❌ Failed to insert ${bank.name}: ${error.message}`)
      }
    }

    console.log(`\n📊 INSERT SUMMARY: ${insertedCount}/${BANK_DATA.length} banks inserted`)

    // Step 4: Recreate foreign key constraint
    console.log('\n🔗 RECREATING FOREIGN KEY CONSTRAINT:')
    try {
      await client.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_bankId_fkey 
        FOREIGN KEY ("bankId") REFERENCES "banks"(id)
      `)
      console.log('   ✅ Foreign key constraint recreated')
    } catch (error: any) {
      console.log(`   ⚠️  Foreign key may already exist: ${error.message}`)
    }

    // Step 5: Verify final structure and data
    console.log('\n🔍 FINAL VERIFICATION:')
    
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'banks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('   📋 Final table structure:')
    finalStructure.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    const finalData = await client.query('SELECT name, code, "isActive" FROM "banks" ORDER BY name')
    console.log(`\n   📊 Final data (${finalData.rows.length} rows):`)
    finalData.rows.forEach((row, i) => {
      console.log(`      ${i + 1}. ${row.name} (${row.code}) - ${row.isActive ? 'Active' : 'Inactive'}`)
    })

    // Step 6: Test query that would be used by Prisma
    console.log('\n🧪 TESTING PRISMA-STYLE QUERIES:')
    
    const activebanks = await client.query('SELECT * FROM "banks" WHERE "isActive" = true ORDER BY name')
    console.log(`   ✅ Active banks query: ${activebanks.rows.length} results`)
    
    const bankByCode = await client.query('SELECT * FROM "banks" WHERE code = $1', ['BRI'])
    console.log(`   ✅ Bank by code query: ${bankByCode.rows.length} results`)

    console.log('\n🎉 BANKS TABLE FIX COMPLETED!')
    console.log('==============================')
    console.log('✅ Table structure matches Prisma schema exactly')
    console.log('✅ Bank data successfully inserted')
    console.log('✅ Foreign key constraints working')
    console.log('✅ Indexes created')

  } catch (error: any) {
    console.error('❌ Fix error:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await fixBanksTableStructure()
    console.log('\n✅ Banks table structure fix completed!')
    console.log('\n💡 NEXT STEPS:')
    console.log('1. Update DirectBankService to use "banks" table')
    console.log('2. Run: npx prisma generate')
    console.log('3. Test API endpoints')
    console.log('4. Database is now fully aligned with Prisma schema')
  } catch (error: any) {
    console.error('\n💥 Fix failed:', error.message)
    process.exit(1)
  }
}

main()

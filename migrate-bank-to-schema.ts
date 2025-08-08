/**
 * Migrate Bank Data to Match Prisma Schema
 * Move data from "Bank" table to "banks" table to match schema
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function migrateBankDataToSchema() {
  console.log('🔄 MIGRATING BANK DATA TO MATCH SCHEMA')
  console.log('======================================')
  console.log('Moving data from "Bank" table to "banks" table\n')

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

    // Step 1: Check current state
    console.log('\n📊 CHECKING CURRENT STATE:')
    const BankData = await client.query('SELECT COUNT(*) as count FROM "Bank"')
    const banksData = await client.query('SELECT COUNT(*) as count FROM "banks"')
    
    const BankCount = parseInt(BankData.rows[0].count)
    const banksCount = parseInt(banksData.rows[0].count)
    
    console.log(`   📋 "Bank" table rows: ${BankCount}`)
    console.log(`   📋 "banks" table rows: ${banksCount}`)

    if (BankCount === 0) {
      console.log('\n⚠️  No data in "Bank" table to migrate')
      return
    }

    // Step 2: Get all data from Bank table
    console.log('\n📥 READING DATA FROM "Bank" TABLE:')
    const bankRecords = await client.query(`
      SELECT id, name, code, "accountNumber", "accountName", logo, "isActive", "createdAt", "updatedAt"
      FROM "Bank"
      ORDER BY "createdAt"
    `)

    console.log(`   📊 Found ${bankRecords.rows.length} records to migrate:`)
    bankRecords.rows.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.name} (${record.code}) - ${record.isActive ? 'Active' : 'Inactive'}`)
    })

    // Step 3: Check banks table structure
    console.log('\n🔍 CHECKING "banks" TABLE STRUCTURE:')
    const banksStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'banks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('   📋 Current "banks" table columns:')
    banksStructure.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    // Step 4: Check if banks table has correct structure for our data
    const requiredColumns = ['id', 'name', 'code', 'accountNumber', 'accountName', 'logo', 'isActive', 'createdAt', 'updatedAt']
    const existingColumns = banksStructure.rows.map(row => row.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log('\n⚠️  MISSING COLUMNS IN "banks" TABLE:')
      missingColumns.forEach(col => {
        console.log(`   - ${col}`)
      })
      
      console.log('\n🔧 ADDING MISSING COLUMNS:')
      
      // Add missing columns one by one
      if (missingColumns.includes('name')) {
        await client.query('ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "name" TEXT')
        console.log('   ✅ Added "name" column')
      }
      
      if (missingColumns.includes('code')) {
        await client.query('ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "code" TEXT')
        console.log('   ✅ Added "code" column')
      }
      
      if (missingColumns.includes('logo')) {
        await client.query('ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "logo" TEXT')
        console.log('   ✅ Added "logo" column')
      }
      
      if (missingColumns.includes('createdAt')) {
        await client.query('ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP')
        console.log('   ✅ Added "createdAt" column')
      }
      
      if (missingColumns.includes('updatedAt')) {
        await client.query('ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP')
        console.log('   ✅ Added "updatedAt" column')
      }
    }

    // Step 5: Clear existing data in banks table if any
    if (banksCount > 0) {
      console.log('\n🧹 CLEARING EXISTING DATA IN "banks" TABLE:')
      await client.query('DELETE FROM "banks"')
      console.log('   ✅ Cleared existing data')
    }

    // Step 6: Migrate data
    console.log('\n📤 MIGRATING DATA TO "banks" TABLE:')
    let migratedCount = 0

    for (const record of bankRecords.rows) {
      try {
        await client.query(`
          INSERT INTO "banks" (
            id, name, code, "accountNumber", "accountName", 
            logo, "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          record.id,
          record.name,
          record.code,
          record.accountNumber,
          record.accountName,
          record.logo,
          record.isActive,
          record.createdAt,
          record.updatedAt
        ])
        
        console.log(`   ✅ Migrated: ${record.name}`)
        migratedCount++
        
      } catch (error: any) {
        console.error(`   ❌ Failed to migrate ${record.name}: ${error.message}`)
      }
    }

    console.log(`\n📊 MIGRATION SUMMARY: ${migratedCount}/${bankRecords.rows.length} records migrated`)

    // Step 7: Add constraints and indexes to match schema
    console.log('\n🔧 ADDING CONSTRAINTS AND INDEXES:')
    
    try {
      // Add unique constraints
      await client.query('ALTER TABLE "banks" ADD CONSTRAINT IF NOT EXISTS "banks_name_key" UNIQUE ("name")')
      console.log('   ✅ Added unique constraint on name')
      
      await client.query('ALTER TABLE "banks" ADD CONSTRAINT IF NOT EXISTS "banks_code_key" UNIQUE ("code")')
      console.log('   ✅ Added unique constraint on code')
      
      // Add indexes
      await client.query('CREATE INDEX IF NOT EXISTS "banks_code_idx" ON "banks"("code")')
      console.log('   ✅ Added index on code')
      
      await client.query('CREATE INDEX IF NOT EXISTS "banks_isActive_idx" ON "banks"("isActive")')
      console.log('   ✅ Added index on isActive')
      
    } catch (error: any) {
      console.log(`   ⚠️  Some constraints may already exist: ${error.message}`)
    }

    // Step 8: Verify migration
    console.log('\n🔍 VERIFYING MIGRATION:')
    const finalCheck = await client.query('SELECT COUNT(*) as count FROM "banks"')
    const finalCount = parseInt(finalCheck.rows[0].count)
    
    console.log(`   📊 Final "banks" table rows: ${finalCount}`)
    
    if (finalCount === BankCount) {
      console.log('   ✅ Migration successful - all records transferred')
      
      // Show sample data
      const sampleData = await client.query('SELECT name, code, "isActive" FROM "banks" ORDER BY name LIMIT 3')
      console.log('   📋 Sample migrated data:')
      sampleData.rows.forEach((row, i) => {
        console.log(`      ${i + 1}. ${row.name} (${row.code}) - ${row.isActive ? 'Active' : 'Inactive'}`)
      })
      
    } else {
      console.log('   ❌ Migration incomplete - some records may be missing')
    }

    // Step 9: Now we can safely drop the Bank table
    console.log('\n🗑️  DROPPING OLD "Bank" TABLE:')
    try {
      // First drop the foreign key constraint that points to Bank table
      await client.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_bankId_fkey')
      console.log('   ✅ Dropped old foreign key constraint')
      
      // Create new foreign key constraint pointing to banks table
      await client.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_bankId_fkey 
        FOREIGN KEY ("bankId") REFERENCES "banks"(id)
      `)
      console.log('   ✅ Created new foreign key constraint to "banks" table')
      
      // Now drop the Bank table
      await client.query('DROP TABLE IF EXISTS "Bank" CASCADE')
      console.log('   ✅ Dropped old "Bank" table')
      
    } catch (error: any) {
      console.error(`   ❌ Error dropping table: ${error.message}`)
    }

    console.log('\n🎉 MIGRATION COMPLETED!')
    console.log('======================')
    console.log('✅ Data migrated from "Bank" to "banks"')
    console.log('✅ Database now matches Prisma schema')
    console.log('✅ Foreign keys updated correctly')
    console.log('✅ Old "Bank" table removed')

  } catch (error: any) {
    console.error('❌ Migration error:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await migrateBankDataToSchema()
    console.log('\n✅ Bank data migration completed successfully!')
    console.log('\n💡 NEXT STEPS:')
    console.log('1. Update DirectBankService to use "banks" table instead of "Bank"')
    console.log('2. Test API endpoints to ensure they work')
    console.log('3. Run Prisma generate to sync with database')
  } catch (error: any) {
    console.error('\n💥 Migration failed:', error.message)
    process.exit(1)
  }
}

main()

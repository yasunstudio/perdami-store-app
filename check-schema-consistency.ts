/**
 * Check Schema vs Database Consistency
 * Verify if database tables match Prisma schema
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Expected tables from Prisma schema with their mapped names
const EXPECTED_TABLES = {
  'User': 'users',
  'Account': 'accounts', 
  'Session': 'sessions',
  'VerificationToken': 'verificationtokens',
  'UserNotificationSettings': 'user_notification_settings',
  'Store': 'stores',
  'ProductBundle': 'product_bundles',
  'Bank': 'banks',  // This should be 'banks' according to schema
  'Order': 'orders',
  'OrderItem': 'order_items',
  'UserActivityLog': 'user_activity_logs',
  'AppSettings': 'app_settings',
  'InAppNotification': 'in_app_notifications',
  'Payment': 'payments',
  'ContactInfo': 'contact_info',
  'QuickAction': 'quick_actions'
}

async function checkSchemaConsistency() {
  console.log('🔍 CHECKING SCHEMA vs DATABASE CONSISTENCY')
  console.log('==========================================')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 10000,
    query_timeout: 10000,
    connectionTimeoutMillis: 5000
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Get all existing tables
    const existingTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations'
      ORDER BY table_name
    `)

    const existingTables = existingTablesResult.rows.map(row => row.table_name)
    const expectedTableNames = Object.values(EXPECTED_TABLES)

    console.log('\n📊 COMPARISON RESULTS:')
    console.log(`   Expected tables: ${expectedTableNames.length}`)
    console.log(`   Existing tables: ${existingTables.length}`)

    // Check for missing tables
    const missingTables = expectedTableNames.filter(table => !existingTables.includes(table))
    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:')
      missingTables.forEach(table => {
        const modelName = (Object.keys(EXPECTED_TABLES) as Array<keyof typeof EXPECTED_TABLES>)
          .find(key => EXPECTED_TABLES[key] === table)
        console.log(`   - ${table} (from model ${modelName})`)
      })
    } else {
      console.log('\n✅ All expected tables exist')
    }

    // Check for extra tables (not in schema)
    const extraTables = existingTables.filter(table => !expectedTableNames.includes(table))
    if (extraTables.length > 0) {
      console.log('\n⚠️  EXTRA TABLES (not in schema):')
      extraTables.forEach(table => {
        console.log(`   - ${table}`)
      })
    } else {
      console.log('\n✅ No extra tables found')
    }

    // Special focus on bank tables issue
    console.log('\n🏦 BANK TABLES ANALYSIS:')
    const bankTableExists = existingTables.includes('banks')
    const BankTableExists = existingTables.includes('Bank')
    
    console.log(`   📋 "banks" table exists: ${bankTableExists ? '✅ YES' : '❌ NO'}`)
    console.log(`   📋 "Bank" table exists: ${BankTableExists ? '⚠️  YES (unexpected)' : '✅ NO'}`)
    console.log(`   🎯 Schema expects: "banks" (lowercase)`)

    if (bankTableExists && BankTableExists) {
      console.log('\n   🚨 ISSUE: Both "banks" and "Bank" tables exist!')
      
      // Check data in both tables
      const banksData = await client.query('SELECT COUNT(*) as count FROM "banks"')
      const BankData = await client.query('SELECT COUNT(*) as count FROM "Bank"')
      
      console.log(`   📊 "banks" table rows: ${banksData.rows[0].count}`)
      console.log(`   📊 "Bank" table rows: ${BankData.rows[0].count}`)
      
      if (parseInt(BankData.rows[0].count) > 0 && parseInt(banksData.rows[0].count) === 0) {
        console.log('\n   💡 RECOMMENDATION: Migrate data from "Bank" to "banks"')
      }
      
    } else if (BankTableExists && !bankTableExists) {
      console.log('\n   ⚠️  Wrong table name: "Bank" should be "banks"')
      console.log('   💡 RECOMMENDATION: Rename "Bank" to "banks" or update schema')
      
    } else if (bankTableExists && !BankTableExists) {
      console.log('\n   ✅ Correct: Only "banks" table exists (matches schema)')
    }

    // Check foreign key references
    console.log('\n🔗 FOREIGN KEY ANALYSIS:')
    const fkCheck = await client.query(`
      SELECT 
        tc.table_name as referencing_table,
        kcu.column_name as referencing_column,
        ccu.table_name as referenced_table,
        ccu.column_name as referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (kcu.column_name = 'bankId' OR ccu.table_name IN ('banks', 'Bank'))
      ORDER BY tc.table_name
    `)

    if (fkCheck.rows.length > 0) {
      console.log('   📋 Bank-related foreign keys:')
      fkCheck.rows.forEach(row => {
        const correctness = row.referenced_table === 'banks' ? '✅' : '⚠️'
        console.log(`   ${correctness} ${row.referencing_table}.${row.referencing_column} -> ${row.referenced_table}.${row.referenced_column}`)
      })
    } else {
      console.log('   ℹ️  No bank-related foreign keys found')
    }

    // Generate fix recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    
    if (BankTableExists && bankTableExists) {
      console.log('   1. 🔄 Migrate data from "Bank" to "banks" table')
      console.log('   2. 🔗 Update foreign keys to reference "banks"')
      console.log('   3. 🗑️  Drop "Bank" table after migration')
      console.log('   4. ✅ This will make database match Prisma schema')
      
    } else if (BankTableExists && !bankTableExists) {
      console.log('   1. 🔄 OPTION A: Rename "Bank" table to "banks"')
      console.log('   2. 🔄 OPTION B: Update Prisma schema to use @@map("Bank")')
      console.log('   3. ✅ Recommended: Option A (rename table to match schema)')
      
    } else if (bankTableExists && !BankTableExists) {
      console.log('   1. ✅ Database structure is correct!')
      console.log('   2. 📝 Update application code to use "banks" table')
      console.log('   3. 🔧 Ensure DirectBankService uses correct table name')
    }

  } catch (error: any) {
    console.error('❌ Schema check error:', error.message)
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await checkSchemaConsistency()
    console.log('\n✅ Schema consistency check completed!')
  } catch (error: any) {
    console.error('\n💥 Check failed:', error.message)
    process.exit(1)
  }
}

main()

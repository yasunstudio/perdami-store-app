/**
 * Database Cleanup Script
 * Remove duplicate/empty bank tables
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function cleanupBankTables() {
  console.log('🧹 DATABASE CLEANUP - BANK TABLES')
  console.log('==================================')

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

    // Check current state
    console.log('\n📊 CURRENT STATE:')
    
    const checkBankTable = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'Bank' AND table_schema = 'public'
    `)
    
    const checkBanksTable = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'banks' AND table_schema = 'public'
    `)

    const bankTableExists = parseInt(checkBankTable.rows[0].count) > 0
    const banksTableExists = parseInt(checkBanksTable.rows[0].count) > 0

    console.log(`   📋 "Bank" table exists: ${bankTableExists ? '✅ YES' : '❌ NO'}`)
    console.log(`   📋 "banks" table exists: ${banksTableExists ? '✅ YES' : '❌ NO'}`)

    if (bankTableExists) {
      const bankRows = await client.query('SELECT COUNT(*) as count FROM "Bank"')
      console.log(`   📊 "Bank" table rows: ${bankRows.rows[0].count}`)
    }

    if (banksTableExists) {
      const banksRows = await client.query('SELECT COUNT(*) as count FROM "banks"')
      console.log(`   📊 "banks" table rows: ${banksRows.rows[0].count}`)
    }

    // Decision logic
    if (bankTableExists && banksTableExists) {
      const bankCount = await client.query('SELECT COUNT(*) as count FROM "Bank"')
      const banksCount = await client.query('SELECT COUNT(*) as count FROM "banks"')
      
      const bankRowCount = parseInt(bankCount.rows[0].count)
      const banksRowCount = parseInt(banksCount.rows[0].count)

      console.log('\n🔍 ANALYSIS:')
      console.log(`   📊 "Bank" has ${bankRowCount} rows`)
      console.log(`   📊 "banks" has ${banksRowCount} rows`)

      if (bankRowCount > 0 && banksRowCount === 0) {
        console.log('\n✅ RECOMMENDATION: Remove empty "banks" table, keep "Bank" table')
        
        console.log('\n🗑️  Dropping empty "banks" table...')
        await client.query('DROP TABLE IF EXISTS "banks"')
        console.log('✅ Empty "banks" table removed')

      } else if (bankRowCount === 0 && banksRowCount > 0) {
        console.log('\n⚠️  ISSUE: "Bank" is empty but "banks" has data')
        console.log('   📝 Recommendation: Migrate data from "banks" to "Bank"')
        
      } else if (bankRowCount > 0 && banksRowCount > 0) {
        console.log('\n⚠️  CONFLICT: Both tables have data')
        console.log('   📝 Manual review needed - showing sample data:')
        
        const bankSample = await client.query('SELECT name, code FROM "Bank" LIMIT 2')
        const banksSample = await client.query('SELECT * FROM "banks" LIMIT 2')
        
        console.log('\n   📋 "Bank" sample:')
        bankSample.rows.forEach(row => {
          console.log(`      - ${row.name} (${row.code})`)
        })
        
        console.log('\n   📋 "banks" sample:')
        banksSample.rows.forEach(row => {
          console.log(`      - ${JSON.stringify(row)}`)
        })
        
      } else {
        console.log('\n⚠️  Both tables are empty')
      }

    } else if (bankTableExists && !banksTableExists) {
      console.log('\n✅ GOOD: Only "Bank" table exists (correct)')
      
    } else if (!bankTableExists && banksTableExists) {
      console.log('\n⚠️  ISSUE: Only "banks" table exists (should be "Bank")')
      
    } else {
      console.log('\n❌ ERROR: No bank tables found')
    }

    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:')
    const finalCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('Bank', 'banks') 
      AND table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log(`   📋 Bank tables remaining: ${finalCheck.rows.length}`)
    finalCheck.rows.forEach(row => {
      console.log(`      - ${row.table_name}`)
    })

  } catch (error: any) {
    console.error('❌ Cleanup error:', error.message)
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await cleanupBankTables()
    console.log('\n✅ Database cleanup completed!')
  } catch (error: any) {
    console.error('\n💥 Cleanup failed:', error.message)
    process.exit(1)
  }
}

main()

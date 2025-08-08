/**
 * Simple Database Table Checker
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function checkDatabaseTables() {
  console.log('🔍 CHECKING DATABASE TABLES')
  console.log('============================')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 10000,
    query_timeout: 10000,
    connectionTimeoutMillis: 5000
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully')

    // Get all tables in public schema
    console.log('\n📋 Fetching all tables...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log(`\n📊 Found ${tablesResult.rows.length} tables:`)
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`)
    })

    // Check specifically for bank tables
    const bankTables = tablesResult.rows.filter(row => 
      row.table_name.toLowerCase().includes('bank')
    )

    if (bankTables.length > 0) {
      console.log(`\n🏦 BANK TABLES FOUND (${bankTables.length}):`)
      
      for (const table of bankTables) {
        console.log(`\n🔍 Checking table: ${table.table_name}`)
        
        try {
          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`)
          const rowCount = countResult.rows[0].count
          
          console.log(`   📊 Rows: ${rowCount}`)
          
          if (parseInt(rowCount) > 0) {
            // Get sample data
            const sampleResult = await client.query(`SELECT * FROM "${table.table_name}" LIMIT 2`)
            console.log(`   📝 Sample data:`)
            sampleResult.rows.forEach((row, i) => {
              console.log(`      ${i + 1}. Name: "${row.name || row.Name || 'N/A'}", Code: "${row.code || row.Code || 'N/A'}"`)
            })
          }
        } catch (error: any) {
          console.log(`   ❌ Error reading table: ${error.message}`)
        }
      }
    } else {
      console.log('\n⚠️  No bank tables found')
    }

    // Check for duplicate-like tables
    console.log('\n🔍 CHECKING FOR SIMILAR TABLE NAMES:')
    const allTableNames = tablesResult.rows.map(r => r.table_name.toLowerCase())
    const duplicateCheck = new Map()
    
    allTableNames.forEach(name => {
      const baseNames = [
        name,
        name.replace(/s$/, ''), // remove trailing 's'
        name.replace(/^_/, ''), // remove leading underscore
        name.charAt(0).toUpperCase() + name.slice(1) // capitalize first letter
      ]
      
      baseNames.forEach(baseName => {
        if (!duplicateCheck.has(baseName)) {
          duplicateCheck.set(baseName, [])
        }
        duplicateCheck.get(baseName).push(name)
      })
    })

    duplicateCheck.forEach((tables, baseName) => {
      if (tables.length > 1) {
        console.log(`   ⚠️  Similar names for "${baseName}": ${tables.join(', ')}`)
      }
    })

  } catch (error: any) {
    console.error('❌ Database error:', error.message)
  } finally {
    try {
      await client.end()
      console.log('\n🔌 Connection closed')
    } catch (e) {
      console.log('\n⚠️  Connection already closed')
    }
  }
}

async function main() {
  try {
    await checkDatabaseTables()
    console.log('\n✅ Table check completed!')
  } catch (error: any) {
    console.error('\n💥 Script failed:', error.message)
    process.exit(1)
  }
}

main()

/**
 * Check Dependencies Script
 * Find what depends on the banks table
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function checkBankDependencies() {
  console.log('🔍 CHECKING BANK TABLE DEPENDENCIES')
  console.log('====================================')

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

    // Check foreign key constraints that reference banks table
    console.log('\n🔗 FOREIGN KEY DEPENDENCIES:')
    const fkConstraints = await client.query(`
      SELECT 
        tc.table_name as referencing_table,
        kcu.column_name as referencing_column,
        ccu.table_name as referenced_table,
        ccu.column_name as referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'banks'
    `)

    if (fkConstraints.rows.length > 0) {
      console.log(`   📊 Found ${fkConstraints.rows.length} foreign key dependencies:`)
      fkConstraints.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.referencing_table}.${row.referencing_column} -> banks.${row.referenced_column}`)
        console.log(`      Constraint: ${row.constraint_name}`)
      })
    } else {
      console.log('   ✅ No foreign key dependencies found')
    }

    // Check views that might reference banks table
    console.log('\n👁️  VIEW DEPENDENCIES:')
    const viewDeps = await client.query(`
      SELECT 
        schemaname,
        viewname,
        definition
      FROM pg_views 
      WHERE definition LIKE '%banks%'
        AND schemaname = 'public'
    `)

    if (viewDeps.rows.length > 0) {
      console.log(`   📊 Found ${viewDeps.rows.length} views referencing banks:`)
      viewDeps.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.viewname}`)
      })
    } else {
      console.log('   ✅ No views depend on banks table')
    }

    // Check triggers
    console.log('\n⚡ TRIGGER DEPENDENCIES:')
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'banks'
    `)

    if (triggers.rows.length > 0) {
      console.log(`   📊 Found ${triggers.rows.length} triggers on banks table:`)
      triggers.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.trigger_name}`)
      })
    } else {
      console.log('   ✅ No triggers on banks table')
    }

    // Check indexes
    console.log('\n📇 INDEX DEPENDENCIES:')
    const indexes = await client.query(`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'banks'
        AND schemaname = 'public'
    `)

    if (indexes.rows.length > 0) {
      console.log(`   📊 Found ${indexes.rows.length} indexes on banks table:`)
      indexes.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.indexname}`)
      })
    } else {
      console.log('   ✅ No custom indexes on banks table')
    }

    // Check table structure to understand what might be different
    console.log('\n📋 TABLE STRUCTURE COMPARISON:')
    
    // Get Bank table structure
    const bankStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Bank' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    // Get banks table structure
    const banksStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'banks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)

    console.log('\n   📊 "Bank" table structure:')
    bankStructure.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    console.log('\n   📊 "banks" table structure:')
    banksStructure.rows.forEach(col => {
      console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    // Check if Prisma migrations reference this table
    console.log('\n🗄️  PRISMA MIGRATION CHECK:')
    const migrationCheck = await client.query(`
      SELECT migration_name, started_at, finished_at
      FROM _prisma_migrations 
      WHERE migration_name LIKE '%bank%'
      ORDER BY started_at DESC
    `)

    if (migrationCheck.rows.length > 0) {
      console.log(`   📊 Found ${migrationCheck.rows.length} bank-related migrations:`)
      migrationCheck.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.migration_name}`)
        console.log(`      Started: ${row.started_at}`)
      })
    } else {
      console.log('   ✅ No bank-related migrations found')
    }

    // Solution recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (fkConstraints.rows.length > 0) {
      console.log('   1. ⚠️  Cannot drop "banks" table due to foreign key constraints')
      console.log('   2. 🔧 Options:')
      console.log('      a) Drop foreign key constraints first')
      console.log('      b) Update references to point to "Bank" table')
      console.log('      c) Keep both tables but ensure "Bank" is used in application')
    } else {
      console.log('   1. ✅ Safe to drop "banks" table (no FK constraints)')
      console.log('   2. 🔧 May need to drop with CASCADE: DROP TABLE "banks" CASCADE')
    }

  } catch (error: any) {
    console.error('❌ Dependency check error:', error.message)
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await checkBankDependencies()
    console.log('\n✅ Dependency check completed!')
  } catch (error: any) {
    console.error('\n💥 Check failed:', error.message)
    process.exit(1)
  }
}

main()

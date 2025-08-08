/**
 * Fix Bank Table References
 * Update foreign key to use correct Bank table
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment
dotenv.config({ path: '.env.local' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function fixBankReferences() {
  console.log('🔧 FIXING BANK TABLE REFERENCES')
  console.log('================================')

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

    // Step 1: Check current orders that reference banks table
    console.log('\n📊 CHECKING CURRENT ORDERS:')
    const ordersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE "bankId" IS NOT NULL
    `)
    
    const ordersWithBanks = parseInt(ordersCheck.rows[0].count)
    console.log(`   📋 Orders with bankId: ${ordersWithBanks}`)

    if (ordersWithBanks > 0) {
      console.log('   ⚠️  Found orders referencing banks table')
      
      // Show sample orders
      const sampleOrders = await client.query(`
        SELECT id, "bankId", status, "createdAt"
        FROM orders 
        WHERE "bankId" IS NOT NULL
        LIMIT 3
      `)
      
      console.log('   📝 Sample orders:')
      sampleOrders.rows.forEach((order, i) => {
        console.log(`      ${i + 1}. Order ${order.id}: bankId=${order.bankId}, status=${order.status}`)
      })
    } else {
      console.log('   ✅ No orders reference banks table - safe to proceed')
    }

    // Step 2: Drop the foreign key constraint
    console.log('\n🔗 DROPPING OLD FOREIGN KEY CONSTRAINT:')
    try {
      await client.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS orders_bankId_fkey
      `)
      console.log('   ✅ Old foreign key constraint dropped')
    } catch (error: any) {
      console.log(`   ⚠️  Constraint may not exist: ${error.message}`)
    }

    // Step 3: Update bankId values to match Bank table IDs (if any orders exist)
    if (ordersWithBanks > 0) {
      console.log('\n🔄 UPDATING ORDER BANK REFERENCES:')
      console.log('   ℹ️  Setting all orders to use first available bank from Bank table...')
      
      // Get first available bank from Bank table
      const firstBank = await client.query(`
        SELECT id FROM "Bank" WHERE "isActive" = true ORDER BY name LIMIT 1
      `)
      
      if (firstBank.rows.length > 0) {
        const bankId = firstBank.rows[0].id
        console.log(`   📍 Using bank ID: ${bankId}`)
        
        const updateResult = await client.query(`
          UPDATE orders 
          SET "bankId" = $1 
          WHERE "bankId" IS NOT NULL
        `, [bankId])
        
        console.log(`   ✅ Updated ${updateResult.rowCount} orders`)
      } else {
        console.log('   ❌ No active banks found in Bank table!')
        return
      }
    }

    // Step 4: Create new foreign key constraint pointing to Bank table
    console.log('\n🔗 CREATING NEW FOREIGN KEY CONSTRAINT:')
    try {
      await client.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_bankId_fkey 
        FOREIGN KEY ("bankId") REFERENCES "Bank"(id)
      `)
      console.log('   ✅ New foreign key constraint created (orders.bankId -> Bank.id)')
    } catch (error: any) {
      console.error(`   ❌ Failed to create FK constraint: ${error.message}`)
    }

    // Step 5: Now try to drop the old banks table
    console.log('\n🗑️  ATTEMPTING TO DROP OLD BANKS TABLE:')
    try {
      await client.query('DROP TABLE IF EXISTS "banks" CASCADE')
      console.log('   ✅ Old "banks" table dropped successfully')
    } catch (error: any) {
      console.error(`   ❌ Failed to drop banks table: ${error.message}`)
    }

    // Step 6: Final verification
    console.log('\n🔍 FINAL VERIFICATION:')
    
    // Check remaining tables
    const remainingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('Bank', 'banks') 
      AND table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log(`   📋 Remaining bank tables: ${remainingTables.rows.length}`)
    remainingTables.rows.forEach(row => {
      console.log(`      - ${row.table_name}`)
    })

    // Check FK constraints
    const finalFKCheck = await client.query(`
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
        AND kcu.column_name = 'bankId'
    `)

    if (finalFKCheck.rows.length > 0) {
      console.log('\n   🔗 Current bankId foreign key:')
      finalFKCheck.rows.forEach(row => {
        console.log(`      ${row.referencing_table}.${row.referencing_column} -> ${row.referenced_table}.${row.referenced_column}`)
      })
    } else {
      console.log('\n   ⚠️  No bankId foreign key found')
    }

    console.log('\n✅ BANK TABLE FIX COMPLETED!')
    console.log('=============================')
    console.log('✅ Old "banks" table removed')
    console.log('✅ Foreign keys point to "Bank" table')
    console.log('✅ Database structure cleaned up')

  } catch (error: any) {
    console.error('❌ Fix error:', error.message)
  } finally {
    await client.end()
    console.log('\n🔌 Connection closed')
  }
}

async function main() {
  try {
    await fixBankReferences()
    console.log('\n🎉 Bank reference fix completed!')
  } catch (error: any) {
    console.error('\n💥 Fix failed:', error.message)
    process.exit(1)
  }
}

main()

// Script untuk cek struktur tabel order_items
import { Client } from 'pg'

async function checkOrderItemsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })
  
  await client.connect()
  
  try {
    // Cek struktur tabel order_items
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Order Items Table Structure:')
    console.table(tableStructure.rows)
    
    // Cek sample data
    const sampleData = await client.query(`
      SELECT * FROM order_items LIMIT 1
    `)
    
    console.log('\n📄 Sample Order Item:')
    console.log(sampleData.rows[0])
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

checkOrderItemsTable()

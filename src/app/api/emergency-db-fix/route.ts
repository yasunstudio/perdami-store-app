import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: NextRequest) {
  console.log('🔧 Emergency DB Fix - Starting connection reset...');
  
  let pool: Pool | null = null;
  
  try {
    // Get database URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found');
    }
    
    // Add SSL parameters to URL if not present
    const urlWithSSL = databaseUrl.includes('sslmode=') 
      ? databaseUrl 
      : databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=require';
    
    console.log('🔗 Creating fresh connection pool with SSL...');
    
    // Create completely new connection pool with specific settings
    pool = new Pool({
      connectionString: urlWithSSL,
      max: 2, // Minimal connections
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 5000,
      query_timeout: 5000,
      ssl: {
        rejectUnauthorized: false // Fix for self-signed certificate
      }
    });
    
    const client = await pool.connect();
    
    try {
      console.log('🧹 Clearing all prepared statements...');
      
      // Force clear all prepared statements
      await client.query('DEALLOCATE ALL');
      
      console.log('🔄 Testing basic queries...');
      
      // Test each table individually
      const userResult = await client.query('SELECT COUNT(*) as count FROM users LIMIT 1');
      const userCount = parseInt(userResult.rows[0].count);
      console.log('✅ Users table:', userCount);
      
      const storeResult = await client.query('SELECT COUNT(*) as count FROM stores LIMIT 1');
      const storeCount = parseInt(storeResult.rows[0].count);
      console.log('✅ Stores table:', storeCount);
      
      const orderResult = await client.query('SELECT COUNT(*) as count FROM orders LIMIT 1');
      const orderCount = parseInt(orderResult.rows[0].count);
      console.log('✅ Orders table:', orderCount);
      
      // Test admin user specifically
      const adminResult = await client.query(`
        SELECT id, email, name, role 
        FROM users 
        WHERE role = 'ADMIN' 
        LIMIT 1
      `);
      const adminUser = adminResult.rows[0];
      
      // Test orders with relationships
      console.log('🔍 Testing order relationships...');
      
      const orderWithUserResult = await client.query(`
        SELECT 
          o.id,
          o.order_number,
          o.order_status,
          o.payment_status,
          o.total_amount,
          u.name as customer_name,
          u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 3
      `);
      
      console.log('✅ Order relationships test:', orderWithUserResult.rows.length);
      
      // Test payment relationships
      const orderWithPaymentResult = await client.query(`
        SELECT 
          o.id,
          o.order_number,
          p.status as payment_status,
          p.method as payment_method
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        LIMIT 3
      `);
      
      console.log('✅ Payment relationships test:', orderWithPaymentResult.rows.length);
      
      const result = {
        status: 'success',
        timestamp: new Date().toISOString(),
        database: 'connected_and_reset',
        method: 'emergency_fix',
        fixes_applied: [
          'DEALLOCATE ALL statements',
          'Fresh connection pool',
          'Tested all core tables',
          'Verified relationships'
        ],
        counts: {
          users: userCount,
          stores: storeCount,
          orders: orderCount
        },
        admin: {
          found: !!adminUser,
          email: adminUser?.email || 'Not found'
        },
        sample_data: {
          orders_with_users: orderWithUserResult.rows,
          orders_with_payments: orderWithPaymentResult.rows
        },
        message: 'Database connection successfully reset and tested'
      };
      
      console.log('✅ Emergency DB fix completed successfully');
      
      return NextResponse.json(result);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Emergency DB fix error:', error);
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'still_error',
      method: 'emergency_fix',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        details: error instanceof Error ? error.stack : undefined
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
    
  } finally {
    if (pool) {
      try {
        await pool.end();
        console.log('🔌 Connection pool closed');
      } catch (closeError) {
        console.error('Error closing pool:', closeError);
      }
    }
  }
}

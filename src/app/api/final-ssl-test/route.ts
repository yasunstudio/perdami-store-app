import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Final SSL test starting...');
    
    // Get database URL
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }, { status: 500 });
    }

    console.log('🔧 Configuring comprehensive SSL bypass...');
    
    // Set Node.js to ignore SSL certificate errors globally
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Ensure SSL parameters in connection string
    const urlWithSSL = DATABASE_URL.includes('sslmode=') 
      ? DATABASE_URL 
      : `${DATABASE_URL}${DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;

    const pool = new Pool({
      connectionString: urlWithSSL,
      ssl: {
        rejectUnauthorized: false,
        requestCert: false,
        checkServerIdentity: () => { return undefined; }
      },
      max: 1,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      query_timeout: 10000
    });

    console.log('🔗 Attempting database connection...');
    
    // Test connection with timeout
    const client = await pool.connect();
    
    // Test queries
    const queries = [
      'SELECT NOW() as server_time',
      'SELECT COUNT(*) as order_count FROM "Order"',
      'SELECT COUNT(*) as user_count FROM "User"'
    ];
    
    const results: Record<string, any> = {};
    for (const query of queries) {
      try {
        const result = await client.query(query);
        const key = query.split(' ')[1].toLowerCase();
        results[key] = result.rows[0];
      } catch (queryError: any) {
        console.error(`Query failed: ${query}`, queryError);
        results[query] = { error: queryError.message };
      }
    }
    
    client.release();
    await pool.end();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Final SSL test successful!');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful with SSL bypass',
      database: 'connected',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      ssl_bypass: 'active',
      results
    }, { status: 200 });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Final SSL test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      error_code: error.code,
      ssl_error: error.code === 'SELF_SIGNED_CERT_IN_CHAIN',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      troubleshooting: {
        issue: 'SSL Certificate Chain Validation',
        solution: 'Comprehensive SSL bypass implemented',
        status: 'testing'
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Same logic for POST
}

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Health check starting...');
    
    // Database connection with SSL bypass
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not found',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }, { status: 500 });
    }

    console.log('🔐 Setting up SSL bypass connection...');
    
    // Ensure SSL parameters
    const urlWithSSL = DATABASE_URL.includes('sslmode=') 
      ? DATABASE_URL 
      : `${DATABASE_URL}${DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;

    const pool = new Pool({
      connectionString: urlWithSSL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    });

    console.log('🔍 Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    
    // Simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    client.release();
    await pool.end();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Health check successful!');
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      server_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version.substring(0, 50) + '...'
    }, { status: 200 });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      error_code: error.code,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    }, { status: 500 });
  }
}

export async function POST() {
  return GET(); // Same logic for POST
}

import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  console.log('🔍 Testing direct PostgreSQL connection for users...')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Check users with raw SQL
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM "User"')
    const userCount = parseInt(userCountResult.rows[0].count)
    console.log(`Raw user count: ${userCount}`)

    // Get sample users
    const usersResult = await client.query(`
      SELECT id, name, email, role, "createdAt" 
      FROM "User" 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `)
    console.log(`Found ${usersResult.rows.length} users with raw query`)

    return NextResponse.json({
      success: true,
      userCount,
      users: usersResult.rows,
      message: 'Direct PostgreSQL connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Direct connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

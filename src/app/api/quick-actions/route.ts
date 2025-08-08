import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  console.log('GET /api/quick-actions called')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database for quick actions query')
    
    const quickActionsQuery = `
      SELECT id, title, description, icon, action, color, "createdAt", "updatedAt"
      FROM quick_actions 
      ORDER BY "createdAt" DESC
    `
    const result = await client.query(quickActionsQuery)
    
    console.log(`Found ${result.rows.length} quick actions`)
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('❌ Quick Actions API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quick actions',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/quick-actions called')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const body = await request.json()
    await client.connect()
    
    const insertQuery = `
      INSERT INTO quick_actions (id, title, description, icon, action, color, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `
    
    const values = [
      body.id || `action-${Date.now()}`,
      body.title,
      body.description,
      body.icon,
      body.action || body.href,
      body.color || '#3B82F6'
    ]
    
    const result = await client.query(insertQuery, values)
    console.log('Created quick action:', result.rows[0].id)
    
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 })
  } catch (error) {
    console.error('❌ Quick Actions POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create quick action',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

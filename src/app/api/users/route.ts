import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const role = searchParams.get('role') as 'ADMIN' | 'CUSTOMER' | 'ALL' | null
  const search = searchParams.get('search')
  const verified = searchParams.get('verified')

  console.log('GET /api/users called with params:', { page, limit, role, search, verified })

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database for users query')

    // Build WHERE clause
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (role && role !== 'ALL') {
      whereConditions.push(`role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (verified !== null && verified !== undefined) {
      if (verified === 'true') {
        whereConditions.push(`"emailVerified" IS NOT NULL`)
      } else if (verified === 'false') {
        whereConditions.push(`"emailVerified" IS NULL`)
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Count total
    const countQuery = `SELECT COUNT(*) as count FROM "User" ${whereClause}`
    const countResult = await client.query(countQuery, queryParams)
    const total = parseInt(countResult.rows[0].count)

    // Get users with pagination
    const offset = (page - 1) * limit
    const usersQuery = `
      SELECT id, name, email, role, "emailVerified", image, "createdAt", "updatedAt"
      FROM "User" 
      ${whereClause}
      ORDER BY "createdAt" DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const usersResult = await client.query(usersQuery, [...queryParams, limit, offset])

    console.log(`Found ${usersResult.rows.length} users (total: ${total})`)

    return NextResponse.json({
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Users API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}

// Temporary stub methods - can be implemented later
export async function POST() {
  return NextResponse.json({ error: 'POST method not implemented yet' }, { status: 501 })
}

export async function PUT() {
  return NextResponse.json({ error: 'PUT method not implemented yet' }, { status: 501 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'DELETE method not implemented yet' }, { status: 501 })
}

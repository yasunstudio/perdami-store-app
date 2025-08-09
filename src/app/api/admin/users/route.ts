import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  console.log("👥 Admin Users API called")
  
  try {
    // Check if user is admin
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const roleParam = searchParams.get('role')
    const search = searchParams.get('search')
    const verified = searchParams.get('verified')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    console.log('👥 Query params:', { page, limit, role: roleParam, search, verified, sortBy, sortOrder })
    
    const offset = (page - 1) * limit
    
    // Build Prisma where conditions
    const whereConditions: any = {}
    
    if (roleParam && roleParam !== 'all') {
      if (roleParam === 'USER' || roleParam === 'CUSTOMER') {
        whereConditions.role = 'CUSTOMER'
      } else if (roleParam === 'ADMIN') {
        whereConditions.role = 'ADMIN'
      }
    }
    
    if (verified && verified !== 'all') {
      if (verified === 'true') {
        whereConditions.emailVerified = { not: null }
      } else {
        whereConditions.emailVerified = null
      }
    }
    
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'name') {
      orderBy = { name: sortOrder as 'asc' | 'desc' }
    } else if (sortBy === 'email') {
      orderBy = { email: sortOrder as 'asc' | 'desc' }
    } else if (sortBy === 'role') {
      orderBy = { role: sortOrder as 'asc' | 'desc' }
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder as 'asc' | 'desc' }
    }

    console.log('🔍 Where conditions:', JSON.stringify(whereConditions, null, 2))

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      // Get users with order counts
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      
      // Get total count
      prisma.user.count({
        where: whereConditions
      })
    ])

    console.log(`📊 Found ${users.length} users out of ${totalCount} total`)

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
      orderCount: user._count.orders,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: !!user.emailVerified
    }))

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = offset + limit < totalCount

    const response = {
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0-admin'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error in GET /api/admin/users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ Admin Users POST API called")
  
  try {
    // Check if user is admin
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, phone } = body
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({
        error: 'Name, email, password, and role are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists'
      }, { status: 400 })
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        phone: phone || null,
        emailVerified: new Date() // Auto-verify admin created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log(`✅ Created new user: ${newUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    })

  } catch (error) {
    console.error('❌ Error in POST /api/admin/users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  console.log("👥 Users API called (Prisma)")
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const role = searchParams.get('role') as UserRole
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    console.log('👥 Query params:', { page, limit, role, search, sortBy, sortOrder })
    
    const offset = (page - 1) * limit
    
    // Build Prisma where conditions
    const whereConditions: any = {}
    
    if (role) {
      whereConditions.role = role
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
    }

    // Execute queries in parallel
    const [users, total, userStats] = await Promise.all([
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
      }),
      
      // Get user statistics by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      })
    ])

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
      updatedAt: user.updatedAt
    }))

    // Format statistics
    const formattedStats = {
      total: total,
      admin: userStats.find(stat => stat.role === 'ADMIN')?._count.role || 0,
      customer: userStats.find(stat => stat.role === 'CUSTOMER')?._count.role || 0
    }

    const response = {
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: formattedStats
      }
    }

    console.log('✅ Users data fetched successfully (Prisma):', {
      usersCount: formattedUsers.length,
      total,
      stats: formattedStats
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching users (Prisma):", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Create new user (POST method) with Prisma
export async function POST(request: NextRequest) {
  console.log('👤 Create user API called (Prisma)')
  
  try {
    const body = await request.json()
    const { name, email, phone, role, password } = body
    
    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ['ADMIN', 'CUSTOMER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password if provided
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }
    
    // Create user using Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        role: role as UserRole,
        password: hashedPassword,
        emailVerified: new Date() // Auto-verify for admin created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ User created successfully (Prisma):', { userId: newUser.id, email })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser }
    })

  } catch (error) {
    console.error('❌ Error creating user (Prisma):', error)
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update user (PUT method) with Prisma
export async function PUT(request: NextRequest) {
  console.log('🔄 Update user API called (Prisma)')
  
  try {
    const body = await request.json()
    const { userId, name, email, phone, role, password } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 409 }
        )
      }
      
      updateData.email = email
    }
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) {
      // Validate role
      const validRoles: UserRole[] = ['ADMIN', 'CUSTOMER']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updateData.role = role as UserRole
    }
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }
    
    updateData.updatedAt = new Date()
    
    // Update user using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ User updated successfully (Prisma):', { userId })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    })

  } catch (error) {
    console.error('❌ Error updating user (Prisma):', error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Delete user (DELETE method) with Prisma
export async function DELETE(request: NextRequest) {
  console.log('🗑️ Delete user API called (Prisma)')
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user has orders
    const userWithOrders = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!userWithOrders) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userWithOrders._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing orders' },
        { status: 409 }
      )
    }

    // Delete user using Prisma (this will cascade delete related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log('✅ User deleted successfully (Prisma):', { userId })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      userId
    })

  } catch (error) {
    console.error('❌ Error deleting user (Prisma):', error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

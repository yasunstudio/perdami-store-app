import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// User statistics API with Prisma
export async function GET(request: NextRequest) {
  console.log('📊 Admin User stats API called (Prisma)')
  
  try {
    // Check if user is admin
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Execute all statistics queries in parallel for better performance
    const [
      totalUsers,
      roleStats,
      userGrowth
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),
      
      // User growth (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Get users with most orders
    const topUsers = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: true
          }
        },
        orders: {
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Format top users with their order stats
    const formattedTopUsers = topUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      orderCount: user._count.orders,
      totalSpent: user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      createdAt: user.createdAt
    }))

    // Format role statistics
    const formattedRoleStats = {
      admin: roleStats.find(stat => stat.role === 'ADMIN')?._count.role || 0,
      customer: roleStats.find(stat => stat.role === 'CUSTOMER')?._count.role || 0
    }

    const response = {
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsersLast30Days: userGrowth
        },
        roleDistribution: formattedRoleStats,
        topUsers: formattedTopUsers
      }
    }

    console.log('✅ User stats fetched successfully (Prisma):', {
      totalUsers,
      roleStats: formattedRoleStats,
      topUsersCount: formattedTopUsers.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching user stats (Prisma):', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

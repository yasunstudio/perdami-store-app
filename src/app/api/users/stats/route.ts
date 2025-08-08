import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('✅ Fetching user stats with Prisma')

    // Get total users, admins, customers in parallel
    const [totalUsers, totalAdmins, totalCustomers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalAdmins,
      totalCustomers,
      newUsers,
      userGrowthPercentage: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0',
      stats: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        newUsers,
        adminPercentage: totalUsers > 0 ? ((totalAdmins / totalUsers) * 100).toFixed(1) : '0',
        customerPercentage: totalUsers > 0 ? ((totalCustomers / totalUsers) * 100).toFixed(1) : '0'
      }
    })
  } catch (error) {
    console.error('❌ User stats error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

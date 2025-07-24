import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/banks/stats - Get bank statistics
export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalBanks,
      activeBanks,
      inactiveBanks,
      recentBanks,
      topBanksByOrders
    ] = await Promise.all([
      // Total banks
      prisma.bank.count(),
      
      // Active banks
      prisma.bank.count({
        where: { isActive: true }
      }),
      
      // Inactive banks
      prisma.bank.count({
        where: { isActive: false }
      }),
      
      // Recent banks (last 30 days)
      prisma.bank.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Top banks by order count
      prisma.bank.findMany({
        include: {
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          orders: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ])

    return NextResponse.json({
      totalBanks,
      activeBanks,
      inactiveBanks,
      recentBanks,
      topBanksByOrders,
      growthRate: totalBanks > 0 ? ((recentBanks / totalBanks) * 100) : 0
    })
  } catch (error) {
    console.error('Error fetching bank stats:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil statistik bank' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus, PaymentMethod } from '@/types'

export async function GET(request: NextRequest) {
  console.log('🔍 Admin orders API called')
  try {
    const session = await auth()
    console.log('🔑 Session check:', session?.user?.role)
    
    if (!session?.user || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authorized:', session?.user?.email)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus | null
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null
    const pickupDate = searchParams.get('pickupDate') || null
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (orderStatus) {
      where.orderStatus = orderStatus
    }
    
    if (paymentStatus) {
      where.payment = {
        status: paymentStatus
      }
    }

    if (pickupDate) {
      const startOfDay = new Date(pickupDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(pickupDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.pickupDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ]
    }

    // Build orderBy clause
    let orderBy: any = {}
    if (sortBy === 'customerName') {
      orderBy = {
        user: {
          name: sortOrder
        }
      }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Get orders with pagination
    console.log('📊 Fetching orders with pagination...')
    console.log('📊 Query params:', { page, limit, skip, where, orderBy })
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            include: {
              bundle: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  store: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          bank: {
            select: {
              id: true,
              name: true,
              accountNumber: true,
              accountName: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              proofUrl: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])
    
    console.log('✅ Orders fetched:', orders.length, 'Total:', total)

    // Get order statistics
    console.log('📈 Fetching order statistics...')
    const stats = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: {
        id: true
      }
    })
    console.log('✅ Order stats:', stats)

    // Get payment statistics from Payment model
    console.log('💳 Fetching payment statistics...')
    const paymentStats = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    console.log('✅ Payment stats:', paymentStats)

    // Calculate total revenue from paid orders
    console.log('💰 Calculating revenue...')
    const totalRevenue = await prisma.order.aggregate({
      where: {
        payment: {
          status: 'PAID'
        }
      },
      _sum: {
        totalAmount: true
      }
    })
    console.log('✅ Total revenue:', totalRevenue._sum.totalAmount || 0)

    // Format statistics
    const orderStats = {
      total: total,
      pending: stats.find(s => s.orderStatus === 'PENDING')?._count.id || 0,
      confirmed: stats.find(s => s.orderStatus === 'CONFIRMED')?._count.id || 0,
      ready: stats.find(s => s.orderStatus === 'READY')?._count.id || 0,
      completed: stats.find(s => s.orderStatus === 'COMPLETED')?._count.id || 0,
      cancelled: stats.find(s => s.orderStatus === 'CANCELLED')?._count.id || 0,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    }

    const paymentStatistics = {
      pending: paymentStats.find(s => s.status === 'PENDING')?._count.id || 0,
      paid: paymentStats.find(s => s.status === 'PAID')?._count.id || 0,
      failed: paymentStats.find(s => s.status === 'FAILED')?._count.id || 0,
      refunded: paymentStats.find(s => s.status === 'REFUNDED')?._count.id || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          bankId: order.bankId,
          customer: {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone
          },
          items: (order.orderItems || []).map(item => ({
            id: item.id,
            bundle: item.bundle,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
          })),
          totalAmount: order.totalAmount,
          orderStatus: order.orderStatus,
          paymentStatus: order.payment?.status || 'PENDING',
          paymentMethod: order.payment?.method || null,
          paymentProof: order.payment?.proofUrl || null,
          pickupMethod: order.pickupMethod,
          pickupDate: order.pickupDate,
          notes: order.notes,
          bank: order.bank,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: orderStats,
        paymentStats: paymentStatistics
      }
    })
  } catch (error) {
    console.error('❌ Error fetching orders:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : error)
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
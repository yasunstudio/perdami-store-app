import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API called - Simple Version")
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus') as OrderStatus
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus
    const search = searchParams.get('search')
    
    console.log('📊 Query params:', { page, limit, orderStatus, paymentStatus, search })
    
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (orderStatus) {
      whereConditions.orderStatus = orderStatus
    }

    if (paymentStatus) {
      whereConditions.payment = {
        status: paymentStatus
      }
    }

    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    console.log('🔍 Where conditions:', JSON.stringify(whereConditions, null, 2))

    // Execute queries - simplified without orderItems first
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              proofUrl: true
            }
          },
          bank: {
            select: {
              id: true,
              name: true,
              code: true,
              accountNumber: true,
              accountName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.order.count({ where: whereConditions })
    ])

    console.log(`✅ Orders fetched: ${orders.length} of ${total} total`)

    const response = {
      success: true,
      data: orders,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Admin orders API error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch orders',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client'
import { auditLog } from '@/lib/audit'
import { notificationService } from '@/lib/notification'
import { SERVICE_FEE, calculateServiceFeePerStore } from '@/lib/service-fee'

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Nama minimal 2 karakter'),
  customerEmail: z.string().email('Email tidak valid'),
  customerPhone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  paymentMethod: z.enum(['BANK_TRANSFER']),
  bankId: z.string().optional(), // Optional karena bisa dipilih nanti
  paymentProof: z.string().optional(), // Optional karena baru create order, belum upload bukti
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  notes: z.string().optional(),
  items: z.array(z.object({
    bundleId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0)
  }))
})

type CreateOrderData = z.infer<typeof createOrderSchema>

// Generate order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp.slice(-8)}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Creating new order...')
    const session = await auth()
    
    if (!session?.user) {
      console.log('❌ Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`✅ Authenticated user: ${session.user.email}`)
    console.log('🔍 Session user details:', JSON.stringify(session.user, null, 2))

    // Find the actual user in database by email (session.user.id might be stale)
    const actualUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    if (!actualUser) {
      console.log('❌ User not found in database:', session.user.email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Found actual user in database:', {
      id: actualUser.id,
      email: actualUser.email,
      sessionId: session.user.id
    })

    const body = await request.json()
    console.log('📝 Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = createOrderSchema.parse(body)
    console.log('✅ Data validation passed')

    // Validate bundles exist and calculate total
    const bundleIds = validatedData.items.map(item => item.bundleId)
    console.log('🔍 Looking for bundles:', bundleIds)
    const bundles = await prisma.productBundle.findMany({
      where: {
        id: { in: bundleIds },
        isActive: true
      },
      include: {
        store: true
      }
    })

    console.log(`🏪 Found ${bundles.length} bundles in database`)
    bundles.forEach(bundle => {
      console.log(`  - ${bundle.name} (${bundle.id}) - Store: ${bundle.store.name}`)
    })

    if (bundles.length !== bundleIds.length) {
      console.log(`❌ Bundle count mismatch: expected ${bundleIds.length}, found ${bundles.length}`)
      return NextResponse.json(
        { error: 'Beberapa bundle tidak ditemukan atau tidak aktif' },
        { status: 400 }
      )
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItems = validatedData.items.map(item => {
      const bundle = bundles.find((p) => p.id === item.bundleId)
      if (!bundle) {
        throw new Error(`Bundle ${item.bundleId} not found`)
      }
      
      const unitPrice = bundle.price
      const totalPrice = unitPrice * item.quantity
      totalAmount += totalPrice
      
      return {
        bundleId: item.bundleId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      }
    })

    // Group items by store
    const storeGroups = new Map()
    validatedData.items.forEach(item => {
      const bundle = bundles.find((p) => p.id === item.bundleId)
      if (bundle) {
        if (!storeGroups.has(bundle.store.id)) {
          storeGroups.set(bundle.store.id, [])
        }
        storeGroups.get(bundle.store.id).push(item)
      }
    })

    // Create order in transaction
    console.log('💾 Starting database transaction...')
    const result = await prisma.$transaction(async (tx) => {
      // Calculate breakdown with service fee per store
      const subtotalAmount = totalAmount // Current total is actually subtotal
      
      // Count unique stores from items
      const uniqueStores = [...new Set(validatedData.items.map(item => {
        const bundle = bundles.find(b => b.id === item.bundleId)
        return bundle?.storeId
      }).filter(Boolean))]
      
      console.log(`🏪 Order involves ${uniqueStores.length} unique stores`)
      
      const serviceFee = calculateServiceFeePerStore(uniqueStores.length)
      const finalTotalAmount = subtotalAmount + serviceFee
      
      console.log(`💰 Order totals: subtotal=${subtotalAmount}, serviceFee=${serviceFee}, total=${finalTotalAmount}`)
      
      // Create main order
      console.log('📝 Creating order record...')
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: actualUser.id,
          subtotalAmount,
          serviceFee,
          totalAmount: finalTotalAmount,
          bankId: validatedData.bankId || null,
          pickupDate: new Date(validatedData.pickupDate),
          notes: validatedData.notes || null,
          orderStatus: 'PENDING',
          orderItems: {
            create: orderItems
          }
        },
        include: {
          orderItems: {
            include: {
              bundle: {
                include: {
                  store: true
                }
              }
            }
          },
          bank: true,
          user: true
        }
      })

      console.log(`✅ Order created: ${order.orderNumber} (ID: ${order.id})`)

      // Create payment record
      console.log('💳 Creating payment record...')
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: finalTotalAmount, // Use final total including service fee
          method: validatedData.paymentMethod as PaymentMethod,
          status: 'PENDING',
          proofUrl: validatedData.paymentProof || null,
          notes: validatedData.notes ? `Order notes: ${validatedData.notes}` : null
        }
      })

      console.log(`✅ Payment record created: ${payment.id}`)
      console.log('✅ Transaction completed successfully')

      return { order, payment }
    })

    // Audit logging for order creation
    try {
      await auditLog.createOrder(actualUser.id, result.order.id, {
        orderNumber: result.order.orderNumber,
        totalAmount: result.order.totalAmount,
        paymentMethod: result.payment.method,
        itemCount: validatedData.items.length,
        items: validatedData.items.map(item => ({
          bundleId: item.bundleId,
          quantity: item.quantity,
          price: item.unitPrice
        }))
      })
    } catch (error) {
      console.error('Failed to log order creation:', error)
    }

    // Send notifications for order creation
    try {
      console.log(`🔔 About to send notification for order: ${result.order.orderNumber}`)
      // await notificationService.notifyNewOrder(result.order.id)
      console.log(`Notification skipped for order: ${result.order.orderNumber}`)
      console.log(`✅ Notification sent for order: ${result.order.orderNumber}`)
    } catch (error) {
      console.error('❌ Failed to send order creation notifications:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        totalAmount: result.order.totalAmount,
        paymentMethod: result.payment.method,
        orderStatus: result.order.orderStatus,
        paymentStatus: result.payment.status,
        pickupDate: result.order.pickupDate,
        createdAt: result.order.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Data tidak valid',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat pesanan' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const orderStatus = searchParams.get('orderStatus')
    const paymentStatus = searchParams.get('paymentStatus')

    // Validate filter parameters
    const validOrderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']
    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: 'Invalid order status filter' },
        { status: 400 }
      )
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status filter' },
        { status: 400 }
      )
    }

    // Find the actual user in database by email
    const actualUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    if (!actualUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const skip = (page - 1) * limit

    const where: any = {
      userId: actualUser.id
    }

    if (orderStatus) {
      where.orderStatus = orderStatus
    }

    if (paymentStatus) {
      where.payment = {
        status: paymentStatus
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              bundle: {
                include: {
                  store: true
                }
              }
            }
          },
          bank: true,
          payment: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data pesanan' },
      { status: 500 }
    )
  }
}
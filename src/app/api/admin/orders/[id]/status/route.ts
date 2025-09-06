import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  
  try {
    console.log('[STATUS UPDATE] Starting request for order:', orderId)
    
    // Check authentication
    console.log('[STATUS UPDATE] Checking authentication...')
    const session = await auth()
    console.log('[STATUS UPDATE] Session retrieved:', !!session, session?.user?.role)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      console.log('[STATUS UPDATE] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[STATUS UPDATE] Authentication passed')

    // Parse request body
    console.log('[STATUS UPDATE] Parsing request body...')
    const body = await request.json()
    console.log('[STATUS UPDATE] Request body:', body)
    const { status } = body

    if (!status) {
      console.log('[STATUS UPDATE] Missing status parameter')
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    console.log('[STATUS UPDATE] Status parameter validated:', status)

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      console.log('[STATUS UPDATE] Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    console.log('[STATUS UPDATE] Status value validated')

    // Get current order
    console.log('[STATUS UPDATE] Fetching current order...')
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderStatus: true, orderNumber: true }
    })
    console.log('[STATUS UPDATE] Current order found:', !!currentOrder, currentOrder?.orderStatus)

    if (!currentOrder) {
      console.log('[STATUS UPDATE] Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('[STATUS UPDATE] Current order status:', currentOrder.orderStatus, '-> New status:', status)

    // Update order status in database
    console.log('[STATUS UPDATE] Updating order in database...')
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        orderStatus: status,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        orderItems: {
          include: {
            bundle: {
              select: { name: true }
            }
          }
        }
      }
    })

    console.log('[STATUS UPDATE] Order updated successfully:', updatedOrder.id, 'New status:', updatedOrder.orderStatus)

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('[STATUS UPDATE] Error updating order status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

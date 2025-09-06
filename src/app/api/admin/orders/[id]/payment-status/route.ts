import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  
  try {
    console.log('[PAYMENT STATUS UPDATE] Starting request for order:', orderId)
    
    // Check authentication
    console.log('[PAYMENT STATUS UPDATE] Checking authentication...')
    const session = await auth()
    console.log('[PAYMENT STATUS UPDATE] Session retrieved:', !!session, session?.user?.role)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      console.log('[PAYMENT STATUS UPDATE] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[PAYMENT STATUS UPDATE] Authentication passed')

    // Parse request body
    console.log('[PAYMENT STATUS UPDATE] Parsing request body...')
    const body = await request.json()
    console.log('[PAYMENT STATUS UPDATE] Request body:', body)
    const { status } = body

    if (!status) {
      console.log('[PAYMENT STATUS UPDATE] Missing status parameter')
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }
    console.log('[PAYMENT STATUS UPDATE] Status parameter validated:', status)

    // Validate status
    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
    if (!validStatuses.includes(status)) {
      console.log('[PAYMENT STATUS UPDATE] Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    console.log('[PAYMENT STATUS UPDATE] Status value validated')

    // Get current order
    console.log('[PAYMENT STATUS UPDATE] Fetching current order...')
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true, orderNumber: true }
    })
    console.log('[PAYMENT STATUS UPDATE] Current order found:', !!currentOrder, currentOrder?.paymentStatus)

    if (!currentOrder) {
      console.log('[PAYMENT STATUS UPDATE] Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('[PAYMENT STATUS UPDATE] Current payment status:', currentOrder.paymentStatus, '-> New status:', status)

    // Update payment status in database
    console.log('[PAYMENT STATUS UPDATE] Updating payment status in database...')
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentStatus: status,
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

    console.log('[PAYMENT STATUS UPDATE] Payment status updated successfully:', updatedOrder.id, 'New status:', updatedOrder.paymentStatus)

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('[PAYMENT STATUS UPDATE] Error updating payment status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

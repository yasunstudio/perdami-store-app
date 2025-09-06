import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params.id
  let requestedStatus: string | undefined
  
  try {
    console.log('[STATUS UPDATE] Starting request for order:', orderId)
    
    // Parse request body
    const body = await request.json()
    console.log('[STATUS UPDATE] Request body:', body)
    requestedStatus = body.status
    
    // Basic validation
    if (!requestedStatus) {
      console.log('[STATUS UPDATE] Missing status parameter')
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Just return success for now to test if the issue is in the update logic
    console.log('[STATUS UPDATE] Returning test success response')
    return NextResponse.json({ 
      success: true, 
      message: 'Status update test successful',
      orderId,
      newStatus: requestedStatus 
    })

  } catch (error) {
    console.error('[STATUS UPDATE] Error updating order status:', error)
    console.error('[STATUS UPDATE] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      orderId,
      requestedStatus
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

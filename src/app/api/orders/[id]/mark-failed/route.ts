import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { PaymentStatusService } from '@/lib/services/payment-status.service'

const markFailedSchema = z.object({
  reason: z.string().min(5, 'Alasan harus minimal 5 karakter'),
  adminNotes: z.string().optional(),
  refundRequired: z.boolean().default(false)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin atau Staff akses diperlukan' },
        { status: 401 }
      )
    }
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID diperlukan' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = markFailedSchema.parse(body)

    const result = await PaymentStatusService.updatePaymentStatus({
      paymentId: orderId, // This should be payment ID, not order ID
      status: 'FAILED',
      notes: `Marked as failed by admin: ${validatedData.reason}${validatedData.adminNotes ? ` - ${validatedData.adminNotes}` : ''}`
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      payment: result.payment
    })

  } catch (error) {
    console.error('Error marking payment as failed:', error)
    
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
      { error: 'Terjadi kesalahan saat mengubah status pembayaran' },
      { status: 500 }
    )
  }
}

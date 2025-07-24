import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { PaymentStatusService } from '@/lib/services/payment-status.service'

const processRefundSchema = z.object({
  reason: z.string().min(5, 'Alasan refund harus minimal 5 karakter'),
  refundAmount: z.number().min(0, 'Jumlah refund tidak boleh negatif'),
  refundMethod: z.enum(['BANK_TRANSFER']),
  adminNotes: z.string().optional(),
  refundReference: z.string().optional() // Nomor referensi refund dari bank/sistem
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
    const validatedData = processRefundSchema.parse(body)

    const result = await PaymentStatusService.updatePaymentStatus({
      paymentId: orderId, // This should be payment ID, not order ID
      status: 'REFUNDED',
      notes: `Refund processed by admin: ${validatedData.reason}${validatedData.adminNotes ? ` - ${validatedData.adminNotes}` : ''}. Refund method: ${validatedData.refundMethod}. Amount: ${validatedData.refundAmount}${validatedData.refundReference ? `. Reference: ${validatedData.refundReference}` : ''}`
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
    console.error('Error processing refund:', error)
    
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
      { error: 'Terjadi kesalahan saat memproses refund' },
      { status: 500 }
    )
  }
}

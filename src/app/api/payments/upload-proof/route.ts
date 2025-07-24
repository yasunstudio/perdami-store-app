// API endpoint for payment proof upload
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { validateFile, fileToBase64 } from '@/lib/upload'
import { auditLog } from '@/lib/audit'
import { notificationService } from '@/lib/notification'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const paymentId = formData.get('paymentId') as string

    if (!file || !paymentId) {
      return NextResponse.json(
        { error: 'File and payment ID are required' },
        { status: 400 }
      )
    }

    // Validate file using the same function as admin upload
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get payment and order
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'STAFF'
    if (!isAdmin && payment.order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if payment can be updated
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot upload proof for non-pending payment' },
        { status: 400 }
      )
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Convert file to base64
    const base64File = await fileToBase64(file)

    // Upload to Cloudinary using the same method as admin upload
    const resourceType = file.type === 'application/pdf' ? 'raw' : 'auto'
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: `perdami-store/payment-proofs`,
      resource_type: resourceType as 'image' | 'video' | 'raw' | 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      unique_filename: true,
      use_filename: true,
    })

    console.log('Payment proof upload successful:', uploadResult.secure_url)
    
    // Update payment with proof URL
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        proofUrl: uploadResult.secure_url,
        updatedAt: new Date()
      },
      include: {
        order: {
          include: {
            user: true
          }
        }
      }
    })

    // Log audit trail
    try {
      await auditLog.uploadPaymentProof(
        session.user.id,
        payment.order.id,
        { proofUrl: uploadResult.secure_url }
      )
    } catch (auditError) {
      console.error('Error logging audit trail:', auditError)
      // Continue execution even if audit fails
    }

    // Send notification to admins
    try {
      await notificationService.sendToAdmins({
        type: 'PAYMENT_CONFIRMED',
        title: 'Bukti Pembayaran Baru',
        message: `Pengguna ${payment.order.user.name} telah mengupload bukti pembayaran untuk pesanan #${payment.order.orderNumber}`,
        data: {
          orderId: payment.order.id,
          paymentId: payment.id,
          proofUrl: uploadResult.secure_url
        }
      })
    } catch (notifError) {
      console.error('Error sending notification:', notifError)
      // Continue execution even if notification fails
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Bukti pembayaran berhasil diupload'
    })

  } catch (error) {
    console.error('Error uploading payment proof:', error)
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Payment not found')) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('Cloudinary')) {
        return NextResponse.json(
          { error: 'File upload failed. Please try again.' },
          { status: 500 }
        )
      }
      if (error.message.includes('Prisma')) {
        return NextResponse.json(
          { error: 'Database error. Please try again.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

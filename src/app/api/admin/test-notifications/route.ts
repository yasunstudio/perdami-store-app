import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationService } from '@/lib/notification'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, userId, orderId, testEmail } = body

    let result = {}

    switch (type) {
      case 'test_email':
        if (testEmail) {
          await emailService.sendEmail({
            to: testEmail,
            subject: 'Test Email from Perdami Store',
            html: `
              <h2>Test Email</h2>
              <p>This is a test email from the Perdami Store notification system.</p>
              <p>Sent at: ${new Date().toISOString()}</p>
            `
          })
          result = { message: 'Test email sent successfully' }
        }
        break

      case 'test_notification':
        if (userId) {
          await notificationService.sendToUser({
            userId,
            type: 'ORDER_CONFIRMED',
            title: 'Test Notification',
            message: 'This is a test notification from the Perdami Store system.',
            data: { testType: 'manual_test', timestamp: new Date().toISOString() }
          })
          result = { message: 'Test notification sent successfully' }
        }
        break

      case 'test_order_notification':
        if (orderId) {
          await notificationService.notifyOrderConfirmed(orderId)
          result = { message: 'Order confirmation notification sent successfully' }
        }
        break

      case 'test_admin_notification':
        await notificationService.sendToAdmins({
          type: 'PAYMENT_FAILED',
          title: 'Test Admin Notification',
          message: 'This is a test admin notification for system administrators.',
          data: { testType: 'admin_broadcast', timestamp: new Date().toISOString() }
        })
        result = { message: 'Admin notification sent successfully' }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}

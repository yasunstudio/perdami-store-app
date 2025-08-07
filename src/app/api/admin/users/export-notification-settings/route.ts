import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.email !== 'admin@perdami.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 })
    }

    // Get users with their notification settings
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        notificationSettings: true
      },
      orderBy: { email: 'asc' }
    })

    // Generate CSV content
    const csvHeaders = [
      'Email',
      'Name',
      'Role',
      'Order Updates',
      'Payment Confirmations',
      'Product Announcements', 
      'Promotional Emails',
      'Security Alerts',
      'Account Updates',
      'Created At'
    ]

    const csvRows = users.map(user => [
      user.email,
      user.name || '',
      user.role,
      user.notificationSettings?.orderUpdates ? 'Yes' : 'No',
      user.notificationSettings?.paymentConfirmations ? 'Yes' : 'No', 
      user.notificationSettings?.productAnnouncements ? 'Yes' : 'No',
      user.notificationSettings?.promotionalEmails ? 'Yes' : 'No',
      user.notificationSettings?.securityAlerts ? 'Yes' : 'No',
      user.notificationSettings?.accountUpdates ? 'Yes' : 'No',
      user.createdAt.toISOString().split('T')[0]
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="notification-settings-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

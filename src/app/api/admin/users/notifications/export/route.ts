import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.email !== 'admin@perdami.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const userIds = searchParams.get('userIds')?.split(',') || []

    // Get users with notification settings
    const users = await prisma.user.findMany({
      where: userIds.length > 0 ? { id: { in: userIds } } : {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        notificationSettings: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'csv') {
      const csvData = generateCSV(users)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="notification-settings.csv"'
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({
        data: users,
        exportedAt: new Date().toISOString(),
        totalUsers: users.length
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateCSV(users: any[]): string {
  const headers = [
    'ID',
    'Email',
    'Name',
    'Role',
    'Created At',
    'Order Updates',
    'Payment Confirmations',
    'Product Announcements',
    'Promotional Emails',
    'Security Alerts',
    'Account Updates'
  ]

  const csvRows = [headers.join(',')]

  for (const user of users) {
    const settings = user.notificationSettings || {}
    const row = [
      user.id,
      user.email,
      user.name || '',
      user.role,
      user.createdAt.toISOString(),
      settings.orderUpdates ? 'Yes' : 'No',
      settings.paymentConfirmations ? 'Yes' : 'No',
      settings.productAnnouncements ? 'Yes' : 'No',
      settings.promotionalEmails ? 'Yes' : 'No',
      settings.securityAlerts ? 'Yes' : 'No',
      settings.accountUpdates ? 'Yes' : 'No'
    ]
    csvRows.push(row.join(','))
  }

  return csvRows.join('\n')
}

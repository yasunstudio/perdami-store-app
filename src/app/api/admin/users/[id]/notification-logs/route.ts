import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.email !== 'admin@perdami.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get notification-related activity logs
    const logs = await prisma.userActivityLog.findMany({
      where: {
        userId: id,
        OR: [
          { action: { contains: 'NOTIFICATION' } },
          { resource: { contains: 'NOTIFICATION' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        details: true,
        createdAt: true,
        ipAddress: true
      }
    })

    // Get total count
    const totalLogs = await prisma.userActivityLog.count({
      where: {
        userId: id,
        OR: [
          { action: { contains: 'NOTIFICATION' } },
          { resource: { contains: 'NOTIFICATION' } }
        ]
      }
    })

    // Transform logs to match the expected format
    const transformedLogs = logs.map(log => ({
      id: log.id,
      type: getNotificationTypeFromAction(log.action),
      message: log.details,
      sentAt: log.createdAt.toISOString(),
      status: getStatusFromAction(log.action)
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        pages: Math.ceil(totalLogs / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching notification logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getNotificationTypeFromAction(action: string): string {
  if (action.includes('ORDER')) return 'order'
  if (action.includes('PAYMENT')) return 'payment'
  if (action.includes('PRODUCT')) return 'product'
  if (action.includes('PROMO')) return 'promo'
  if (action.includes('SECURITY')) return 'security'
  if (action.includes('ACCOUNT')) return 'account'
  return 'system'
}

function getStatusFromAction(action: string): 'sent' | 'failed' | 'pending' {
  if (action.includes('FAILED')) return 'failed'
  if (action.includes('PENDING')) return 'pending'
  return 'sent'
}

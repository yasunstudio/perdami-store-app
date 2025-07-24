import { NextRequest, NextResponse } from 'next/server'
import { UserActivityLogService } from '@/features/users/services/user-activity-log.service'
import { getAuditLogs } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const resource = searchParams.get('resource')

    // Menggunakan UserActivityLogService untuk mendapatkan data dari database
    const filters = {
      userId: userId || undefined,
      action: action && action !== 'ALL' ? action : undefined,
      resource: resource && resource !== 'ALL' ? resource : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    }

    const result = await UserActivityLogService.getActivityLogs(page, limit, filters)

    // Format data untuk kompatibilitas dengan frontend
    const activities = result.logs.map(log => ({
      id: log.id,
      action: log.action,
      targetUserId: log.resourceId || '',
      targetUserName: log.user?.name || 'Unknown',
      targetUserEmail: log.user?.email || '',
      performedBy: log.userId,
      performedByName: log.user?.name || 'Unknown',
      details: log.details || '',
      createdAt: log.createdAt.toISOString()
    }))

    return NextResponse.json({
      activities,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserActivityLogService } from '@/features/users/services/user-activity-log.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') as string | null
    const resource = searchParams.get('resource')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const filters = {
      userId: userId || undefined,
      action: action || undefined,
      resource: resource || undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    }

    const result = await UserActivityLogService.getActivityLogs(page, limit, filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in activity logs API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract IP and User Agent from request headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const result = await UserActivityLogService.createLog({
      ...body,
      ipAddress: ip,
      userAgent,
    })
    
    if (result.success) {
      return NextResponse.json(result.log, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}

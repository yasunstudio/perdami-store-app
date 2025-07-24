import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Get all logs (or apply same filters as the main route)
    const options: any = {
      limit: 10000, // Large limit for export
      offset: 0,
    };

    // Apply same filters as main route
    const resource = searchParams.get('resource');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const dateRange = searchParams.get('dateRange');

    if (resource) options.resource = resource;
    if (action) options.action = action;
    if (userId) options.userId = userId;

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      switch (dateRange) {
        case 'today':
          options.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          options.startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          options.endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          options.startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          break;
        case 'month':
          options.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    const result = await getAuditLogs(options);

    // Convert to CSV
    const csvHeader = 'Timestamp,User,Email,Role,Action,Resource,Resource ID,Details,IP Address,User Agent\n';
    const csvRows = result.logs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        `"${log.user.name || ''}"`,
        `"${log.user.email}"`,
        log.user.role,
        log.action,
        log.resource,
        log.resourceId || '',
        `"${details}"`,
        log.ipAddress || '',
        `"${log.userAgent || ''}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });

  } catch (error) {
    console.error('Audit logs export error:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateRange: z.string().optional(),
});

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
    const params = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const offset = (page - 1) * limit;

    // Build filter options
    const options: any = {
      limit,
      offset,
    };

    if (params.resource) {
      options.resource = params.resource;
    }

    if (params.action) {
      options.action = params.action;
    }

    if (params.userId) {
      options.userId = params.userId;
    }

    // Handle date range
    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      switch (params.dateRange) {
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

    // If search term is provided, filter in memory (simple implementation)
    let filteredLogs = result.logs;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredLogs = result.logs.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.user.name?.toLowerCase().includes(searchLower) ||
        log.user.email.toLowerCase().includes(searchLower) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      logs: filteredLogs,
      total: result.total,
      hasMore: result.hasMore,
      page,
      limit,
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BATCH_CONFIG } from '@/features/admin/analytics/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const storeIdsParam = searchParams.get('storeIds');
    const batchIdsParam = searchParams.get('batchIds');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const storeIds = storeIdsParam ? storeIdsParam.split(',') : [];
    const batchIds = batchIdsParam ? batchIdsParam.split(',') : [];
    
    // Build date filter
    let dateStart = startDate ? new Date(startDate) : new Date();
    let dateEnd = endDate ? new Date(endDate) : new Date();
    
    // If no date filter specified, use today
    if (!startDate && !endDate) {
      dateStart.setHours(0, 0, 0, 0);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (endDate) {
      dateEnd.setHours(23, 59, 59, 999);
    }
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    // Determine current active batch
    const isInBatch1 = currentHour >= 6 && currentHour < 18;
    const isInBatch2 = currentHour >= 18 || currentHour < 6;

    // Build store filter for orders
    const storeFilter: any = {};
    if (storeIds.length > 0) {
      storeFilter.orderItems = {
        some: {
          bundle: {
            storeId: {
              in: storeIds
            }
          }
        }
      };
    }

    // Batch 1: 06:00-18:00 within date range
    const batch1Start = new Date(dateStart);
    batch1Start.setHours(6, 0, 0, 0);
    const batch1End = new Date(dateEnd);
    batch1End.setHours(18, 0, 0, 0);

    // Get Batch 1 orders (06:00-18:00 within date range)
    const batch1Orders = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: batch1Start,
          lte: batch1End
        },
        ...storeFilter
      },
      select: {
        totalAmount: true
      }
    });

    // Batch 2: 18:00-06:00 (handle spanning midnight within date range)
    let batch2Orders: any[] = [];
    
    // For batch 2, we need to handle the fact that it spans midnight
    // We'll query 18:00-23:59 and 00:00-06:00 within the date range
    const batch2Evening = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: new Date(dateStart.getTime()).setHours(18, 0, 0, 0),
          lte: new Date(dateEnd.getTime()).setHours(23, 59, 59, 999)
        },
        ...storeFilter
      },
      select: {
        totalAmount: true
      }
    });

    const batch2Morning = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: new Date(dateStart.getTime()).setHours(0, 0, 0, 0),
          lte: new Date(dateEnd.getTime()).setHours(6, 0, 0, 0)
        },
        ...storeFilter
      },
      select: {
        totalAmount: true
      }
    });

    batch2Orders = [...batch2Evening, ...batch2Morning];

    // Calculate metrics
    const batch1OrderCount = batch1Orders.length;
    const batch1Value = batch1Orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const batch2OrderCount = batch2Orders.length;
    const batch2Value = batch2Orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const allBatches = [
      {
        id: BATCH_CONFIG.batch1.id,
        name: BATCH_CONFIG.batch1.displayName,
        timeRange: `${BATCH_CONFIG.batch1.startTime} - ${BATCH_CONFIG.batch1.endTime}`,
        startTime: BATCH_CONFIG.batch1.startTime,
        endTime: BATCH_CONFIG.batch1.endTime,
        cutoffTime: BATCH_CONFIG.batch1.cutoffTime,
        orderCount: batch1OrderCount,
        totalValue: batch1Value,
        isActive: isInBatch1,
        isCurrent: isInBatch1
      },
      {
        id: BATCH_CONFIG.batch2.id,
        name: BATCH_CONFIG.batch2.displayName,
        timeRange: `${BATCH_CONFIG.batch2.startTime} - ${BATCH_CONFIG.batch2.endTime}`,
        startTime: BATCH_CONFIG.batch2.startTime,
        endTime: BATCH_CONFIG.batch2.endTime,
        cutoffTime: BATCH_CONFIG.batch2.cutoffTime,
        orderCount: batch2OrderCount,
        totalValue: batch2Value,
        isActive: isInBatch2,
        isCurrent: isInBatch2
      }
    ];

    // Filter batches if batchIds are specified
    const filteredBatches = batchIds.length > 0 
      ? allBatches.filter(batch => batchIds.includes(batch.id))
      : allBatches;

    return NextResponse.json({
      success: true,
      batches: filteredBatches
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

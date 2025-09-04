import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BATCH_CONFIG } from '@/features/admin/analytics/constants';

export async function GET(request: NextRequest) {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    // Determine current active batch
    const isInBatch1 = currentHour >= 6 && currentHour < 18;
    const isInBatch2 = currentHour >= 18 || currentHour < 6;
    
    // Calculate actual order counts and values from database
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Batch 1: 06:00-18:00
    const batch1Start = new Date(today);
    batch1Start.setHours(6, 0, 0, 0);
    const batch1End = new Date(today);
    batch1End.setHours(18, 0, 0, 0);

    // Batch 2: 18:00-06:00 (spans midnight)
    const batch2StartToday = new Date(today);
    batch2StartToday.setHours(18, 0, 0, 0);
    const batch2EndTomorrow = new Date(today);
    batch2EndTomorrow.setDate(today.getDate() + 1);
    batch2EndTomorrow.setHours(6, 0, 0, 0);

    const batch2StartYesterday = new Date(today);
    batch2StartYesterday.setDate(today.getDate() - 1);
    batch2StartYesterday.setHours(18, 0, 0, 0);
    const batch2EndToday = new Date(today);
    batch2EndToday.setHours(6, 0, 0, 0);

    // Get Batch 1 orders (06:00-18:00 today)
    const batch1Orders = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: batch1Start,
          lt: batch1End
        }
      },
      select: {
        totalAmount: true
      }
    });

    // Get Batch 2 orders (18:00 yesterday - 06:00 today OR 18:00 today - 06:00 tomorrow)
    const batch2OrdersYesterday = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: batch2StartYesterday,
          lt: batch2EndToday
        }
      },
      select: {
        totalAmount: true
      }
    });

    const batch2OrdersToday = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED',
        createdAt: {
          gte: batch2StartToday,
          lt: batch2EndTomorrow
        }
      },
      select: {
        totalAmount: true
      }
    });

    // Combine batch 2 orders
    const batch2Orders = [...batch2OrdersYesterday, ...batch2OrdersToday];

    // Calculate metrics
    const batch1OrderCount = batch1Orders.length;
    const batch1Value = batch1Orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const batch2OrderCount = batch2Orders.length;
    const batch2Value = batch2Orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    const batches = [
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

    return NextResponse.json({
      success: true,
      batches
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { BATCH_CONFIG } from '@/features/admin/analytics/constants';

export async function GET(request: NextRequest) {
  try {
    // For now, return static batch configuration
    // In the future, this could be dynamic based on database configuration
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    // Determine current active batch
    const isInBatch1 = currentHour >= 6 && currentHour < 18;
    const isInBatch2 = currentHour >= 18 || currentHour < 6;
    
    // Mock order counts - in production, this would come from actual database queries
    const batch1OrderCount = 25; // This should be calculated from actual orders
    const batch2OrderCount = 18; // This should be calculated from actual orders
    
    const batch1Value = 850000; // This should be calculated from actual orders
    const batch2Value = 650000; // This should be calculated from actual orders

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

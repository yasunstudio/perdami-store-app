import { NextRequest, NextResponse } from 'next/server';

// Fallback batch config in case import fails
const FALLBACK_BATCH_CONFIG = {
  batch1: {
    id: 'batch_1',
    name: 'batch1',
    displayName: 'Batch 1 (Siang)',
    startTime: '06:00',
    endTime: '18:00',
    cutoffTime: '15:00',
    description: 'Batch siang untuk pickup 18:00-20:00'
  },
  batch2: {
    id: 'batch_2',
    name: 'batch2',
    displayName: 'Batch 2 (Malam)',
    startTime: '18:00',
    endTime: '06:00',
    cutoffTime: '03:00',
    description: 'Batch malam untuk pickup 08:00-12:00'
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('[Batches API] Starting fetch batches...');
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    console.log('[Batches API] Current hour:', currentHour);
    
    // Determine current active batch
    const isInBatch1 = currentHour >= 6 && currentHour < 18;
    const isInBatch2 = currentHour >= 18 || currentHour < 6;

    console.log('[Batches API] Batch states - Batch1:', isInBatch1, 'Batch2:', isInBatch2);

    // Use fallback config for now to avoid import issues
    let batchConfig = FALLBACK_BATCH_CONFIG;
    
    // Try to import the actual config
    try {
      const { BATCH_CONFIG } = await import('@/features/admin/analytics/constants');
      if (BATCH_CONFIG && BATCH_CONFIG.batch1 && BATCH_CONFIG.batch2) {
        batchConfig = BATCH_CONFIG;
        console.log('[Batches API] Using imported BATCH_CONFIG');
      } else {
        console.log('[Batches API] Using fallback config - imported config incomplete');
      }
    } catch (importError) {
      console.log('[Batches API] Using fallback config - import failed:', importError);
    }

    // Simple batch configuration data for selection purposes only
    const batches = [
      {
        id: batchConfig.batch1.id,
        name: batchConfig.batch1.displayName,
        timeRange: `${batchConfig.batch1.startTime} - ${batchConfig.batch1.endTime}`,
        startTime: batchConfig.batch1.startTime,
        endTime: batchConfig.batch1.endTime,
        cutoffTime: batchConfig.batch1.cutoffTime,
        description: batchConfig.batch1.description,
        isActive: isInBatch1,
        isCurrent: isInBatch1
      },
      {
        id: batchConfig.batch2.id,
        name: batchConfig.batch2.displayName,
        timeRange: `${batchConfig.batch2.startTime} - ${batchConfig.batch2.endTime}`,
        startTime: batchConfig.batch2.startTime,
        endTime: batchConfig.batch2.endTime,
        cutoffTime: batchConfig.batch2.cutoffTime,
        description: batchConfig.batch2.description,
        isActive: isInBatch2,
        isCurrent: isInBatch2
      }
    ];

    console.log('[Batches API] Generated batches:', batches);

    return NextResponse.json({
      success: true,
      batches
    });

  } catch (error) {
    console.error('[Batches API] Error fetching batches:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      dateFilter.lte = endDateTime;
    }

    // Build batch filter for order timing
    const batchTimeFilter: any = {};
    if (batchIds.length > 0) {
      // Build time conditions based on selected batches
      const timeConditions: any[] = [];
      
      for (const batchId of batchIds) {
        if (batchId === 'batch_1') {
          // Batch 1: 06:00 - 18:00
          timeConditions.push({
            pickupTime: {
              gte: new Date().setHours(6, 0, 0, 0),
              lt: new Date().setHours(18, 0, 0, 0)
            }
          });
        } else if (batchId === 'batch_2') {
          // Batch 2: 18:00 - 06:00 (next day)
          timeConditions.push({
            OR: [
              {
                pickupTime: {
                  gte: new Date().setHours(18, 0, 0, 0),
                  lt: new Date().setHours(23, 59, 59, 999)
                }
              },
              {
                pickupTime: {
                  gte: new Date().setHours(0, 0, 0, 0),
                  lt: new Date().setHours(6, 0, 0, 0)
                }
              }
            ]
          });
        }
      }
      
      if (timeConditions.length > 0) {
        batchTimeFilter.OR = timeConditions;
      }
    }

    // Build order filter
    const orderFilter: any = {
      orderStatus: 'CONFIRMED',
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      ...(Object.keys(batchTimeFilter).length > 0 ? batchTimeFilter : {})
    };

    // Fetch all active stores
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        ...(storeIds.length > 0 ? { id: { in: storeIds } } : {})
      },
      include: {
        bundles: {
          include: {
            orderItems: {
              include: {
                order: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate metrics for each store based on filtered orders
    const storeData = stores.map((store: any) => {
      // Get all filtered orders through bundles
      const orderItems = store.bundles.flatMap((bundle: any) => bundle.orderItems);
      const uniqueOrders = new Map();
      
      orderItems.forEach((item: any) => {
        if (item.order) {
          // Apply order filter manually since we can't filter nested relations directly
          const order = item.order;
          let includeOrder = order.orderStatus === 'CONFIRMED';
          
          // Apply date filter
          if (Object.keys(dateFilter).length > 0) {
            const orderDate = new Date(order.createdAt);
            if (dateFilter.gte && orderDate < dateFilter.gte) includeOrder = false;
            if (dateFilter.lte && orderDate > dateFilter.lte) includeOrder = false;
          }
          
          // Apply batch filter
          if (Object.keys(batchTimeFilter).length > 0 && order.pickupTime) {
            const pickupTime = new Date(order.pickupTime);
            const pickupHour = pickupTime.getHours();
            
            let matchesBatch = false;
            for (const batchId of batchIds) {
              if (batchId === 'batch_1' && pickupHour >= 6 && pickupHour < 18) {
                matchesBatch = true;
                break;
              } else if (batchId === 'batch_2' && (pickupHour >= 18 || pickupHour < 6)) {
                matchesBatch = true;
                break;
              }
            }
            if (!matchesBatch) includeOrder = false;
          }
          
          if (includeOrder) {
            uniqueOrders.set(order.id, order);
          }
        }
      });

      const orders = Array.from(uniqueOrders.values());
      const orderCount = orders.length;
      const totalValue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);

      return {
        id: store.id,
        name: store.name,
        address: store.description || '', // Using description as address fallback
        phone: store.whatsappNumber || '',
        orderCount,
        totalValue,
        status: store.isActive ? 'active' : 'inactive',
        lastUpdated: store.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      stores: storeData
    });

  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

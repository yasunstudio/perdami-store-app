import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get batch based on order creation time (matching frontend logic)
const getBatchFromOrderTime = (orderDate: Date): string => {
  // Convert to Indonesia timezone (UTC+7)
  const indonesiaTime = new Date(orderDate.getTime() + (7 * 60 * 60 * 1000));
  const hour = indonesiaTime.getUTCHours();
  
  console.log(`Original: ${orderDate.toISOString()}, Indonesia: ${indonesiaTime.toISOString()}, Hour: ${hour}`);
  
  return hour >= 6 && hour < 18 ? 'batch_1' : 'batch_2';
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const batchId = searchParams.get('batchId');

    console.log('Store Payment Details API called with:', { storeId, startDate, endDate, batchId });

    // Build where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED', // Only confirmed orders
    };

    // Date range filter based on pickup date
    if (startDate || endDate) {
      whereClause.pickupDate = {};
      if (startDate) {
        whereClause.pickupDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.pickupDate.lte = end;
      }
    }

    console.log('WHERE CLAUSE:', JSON.stringify(whereClause, null, 2));

    // Note: Batch filtering will be applied after data retrieval

    // Fetch orders with all related data
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          }
        },
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                contents: true,
                costPrice: true,
                store: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                  }
                }
              }
            }
          },
          // Filter orderItems by store if storeId is provided
          ...(storeId && {
            where: {
              bundle: {
                storeId: storeId
              }
            }
          })
        }
      },
      orderBy: {
        pickupDate: 'asc'
      }
    });

    console.log(`RAW ORDERS FOUND: ${orders.length}`);
    orders.forEach((order, index) => {
      if (index < 3) { // Log first 3 for debugging
        console.log(`Order ${index + 1}: ${order.orderNumber}, pickup: ${order.pickupDate?.toISOString()}, status: ${order.orderStatus}`);
      }
    });

    // Transform data to flat list of payment details
    const paymentDetails: any[] = [];
    
    orders.forEach(order => {
      // Apply batch filtering if specified
      if (batchId) {
        const orderBatch = getBatchFromOrderTime(order.createdAt);
        console.log(`Order ${order.id}: createdAt=${order.createdAt.toISOString()}, batch=${orderBatch}, filter=${batchId}`);
        if (orderBatch !== batchId) return;
      }

      // Filter order items by store if specified
      const relevantItems = storeId 
        ? order.orderItems.filter(item => item.bundle?.store?.id === storeId)
        : order.orderItems;

      // Skip orders with no relevant items
      if (relevantItems.length === 0) return;

      relevantItems.forEach(item => {
        if (item.bundle && item.bundle.store) {
          const costPrice = Number(item.bundle.costPrice || 0);
          const totalPrice = costPrice * item.quantity;

          paymentDetails.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            customerName: order.user?.name || 'N/A',
            customerPhone: order.user?.phone || null,
            itemName: item.bundle.name,
            bundleContents: item.bundle.contents || null,
            quantity: item.quantity,
            unitPrice: costPrice,
            totalPrice: totalPrice,
            orderNotes: order.notes || null,
            pickupDate: order.pickupDate,
            storeId: item.bundle.store.id,
            storeName: item.bundle.store.name,
          });
        }
      });
    });

    // Calculate summary
    const totalItems = paymentDetails.reduce((sum, detail) => sum + detail.quantity, 0);
    const totalCost = paymentDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);
    const uniqueOrders = new Set(paymentDetails.map(detail => detail.orderId));
    const totalOrders = uniqueOrders.size;

    // Get store name for summary
    let storeName = 'All Stores';
    if (storeId && paymentDetails.length > 0) {
      storeName = paymentDetails[0].storeName;
    }

    const summary = {
      totalItems,
      totalCost,
      totalOrders,
      storeName,
    };

    const responseData = {
      details: paymentDetails,
      summary,
      filters: {
        storeId: storeId || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in store-payment-details API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

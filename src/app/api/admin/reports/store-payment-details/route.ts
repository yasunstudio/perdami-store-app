import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const batchId = searchParams.get('batchId');

    // Build where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED', // Only confirmed orders
    };

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Batch filter - add time-based filtering to where clause
    if (batchId) {
      const now = new Date();
      let batchStart: Date, batchEnd: Date;

      if (batchId === 'batch_1') {
        // Batch 1: 06:00-18:00
        // If we already have date filters, use them as base, otherwise use today
        const baseDate = startDate ? new Date(startDate) : now;
        batchStart = new Date(baseDate);
        batchStart.setHours(6, 0, 0, 0);
        
        const endBaseDate = endDate ? new Date(endDate) : now;
        batchEnd = new Date(endBaseDate);
        batchEnd.setHours(18, 0, 0, 0);

        // If no date range specified, filter for today's batch 1
        if (!startDate && !endDate) {
          whereClause.createdAt = {
            gte: batchStart,
            lt: batchEnd
          };
        }
      } else if (batchId === 'batch_2') {
        // Batch 2: 18:00-06:00 (spans two days)
        const baseDate = startDate ? new Date(startDate) : now;
        batchStart = new Date(baseDate);
        batchStart.setHours(18, 0, 0, 0);

        const endBaseDate = endDate ? new Date(endDate) : now;
        batchEnd = new Date(endBaseDate);
        batchEnd.setDate(batchEnd.getDate() + 1);
        batchEnd.setHours(6, 0, 0, 0);

        // If no date range specified, filter for current batch 2
        if (!startDate && !endDate) {
          whereClause.createdAt = {
            gte: batchStart,
            lt: batchEnd
          };
        }
      }
    }

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
              include: {
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

    // Transform data to flat list of payment details
    const paymentDetails: any[] = [];
    
    orders.forEach(order => {
      // Additional batch filtering if both date range and batch are specified
      if (batchId && (startDate || endDate)) {
        const orderHour = new Date(order.createdAt).getHours();
        const orderBatch = orderHour >= 6 && orderHour < 18 ? 'batch_1' : 'batch_2';
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

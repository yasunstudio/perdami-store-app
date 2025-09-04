import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active stores
    const stores = await prisma.store.findMany({
      where: {
        isActive: true
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

    // Calculate metrics for each store
    const storeData = stores.map(store => {
      // Get all confirmed orders through bundles
      const orderItems = store.bundles.flatMap((bundle: any) => bundle.orderItems);
      const uniqueOrders = new Map();
      
      orderItems.forEach((item: any) => {
        if (item.order && item.order.orderStatus === 'CONFIRMED') {
          uniqueOrders.set(item.order.id, item.order);
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

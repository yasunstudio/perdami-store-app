import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug] Starting debug query...');
    
    // First, let's check basic order data
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        totalAmount: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`[Debug] Found ${allOrders.length} orders total`);
    console.log('[Debug] Sample orders:', allOrders);
    
    // Check confirmed orders only
    const confirmedOrders = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED'
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        totalAmount: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`[Debug] Found ${confirmedOrders.length} confirmed orders`);
    console.log('[Debug] Confirmed orders:', confirmedOrders);
    
    // Check stores
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        isActive: true
      },
      take: 10
    });
    
    console.log(`[Debug] Found ${stores.length} stores`);
    console.log('[Debug] Stores:', stores);
    
    // Check bundles
    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10
    });
    
    console.log(`[Debug] Found ${bundles.length} bundles`);
    console.log('[Debug] Bundles:', bundles);
    
    // Check order items
    const orderItems = await prisma.orderItem.findMany({
      select: {
        id: true,
        orderId: true,
        bundleId: true,
        quantity: true,
        bundle: {
          select: {
            id: true,
            name: true,
            storeId: true,
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            orderStatus: true,
            createdAt: true
          }
        }
      },
      take: 10
    });
    
    console.log(`[Debug] Found ${orderItems.length} order items`);
    console.log('[Debug] Order items:', orderItems);
    
    // Check specific relationship: confirmed orders with items and stores
    const ordersWithItems = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED'
      },
      include: {
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        }
      },
      take: 5
    });
    
    console.log(`[Debug] Found ${ordersWithItems.length} confirmed orders with items`);
    ordersWithItems.forEach((order, index) => {
      console.log(`[Debug] Order ${index + 1}:`, {
        id: order.id,
        status: order.orderStatus,
        createdAt: order.createdAt,
        itemsCount: order.orderItems.length,
        items: order.orderItems.map(item => ({
          bundleName: item.bundle?.name,
          storeName: item.bundle?.store?.name,
          storeId: item.bundle?.store?.id
        }))
      });
    });
    
    return NextResponse.json({
      success: true,
      debug: {
        totalOrders: allOrders.length,
        confirmedOrders: confirmedOrders.length,
        stores: stores.length,
        bundles: bundles.length,
        orderItems: orderItems.length,
        ordersWithItems: ordersWithItems.length
      },
      data: {
        orders: allOrders,
        confirmedOrders,
        stores,
        bundles,
        orderItems: orderItems.slice(0, 3), // Only first 3 for readability
        ordersWithItems: ordersWithItems.map(order => ({
          id: order.id,
          status: order.orderStatus,
          createdAt: order.createdAt,
          itemsCount: order.orderItems.length,
          storeNames: [...new Set(order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean))]
        }))
      }
    });
    
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      { 
        error: 'Debug query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug-Detail] Starting detailed analysis...');
    
    // Check for "Bebek Si Kembar" specifically
    const bebekStore = await prisma.store.findFirst({
      where: {
        name: {
          contains: 'Bebek',
          mode: 'insensitive'
        }
      },
      include: {
        bundles: {
          include: {
            orderItems: {
              include: {
                order: {
                  select: {
                    id: true,
                    orderStatus: true,
                    createdAt: true,
                    orderNumber: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('[Debug-Detail] Bebek store found:', bebekStore);
    
    // Check orders from today specifically
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        },
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
      }
    });
    
    console.log(`[Debug-Detail] Today's orders (${startOfDay.toISOString()} - ${endOfDay.toISOString()}):`, todayOrders.length);
    
    // Check all confirmed orders with date analysis
    const allConfirmedWithDates = await prisma.order.findMany({
      where: {
        orderStatus: 'CONFIRMED'
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        orderItems: {
          include: {
            bundle: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const dateAnalysis = allConfirmedWithDates.map(order => {
      const stores = order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        date: order.createdAt.toISOString().split('T')[0],
        hour: order.createdAt.getHours(),
        stores: [...new Set(stores)],
        hasBebekSiKembar: stores.some(name => name?.toLowerCase().includes('bebek'))
      };
    });
    
    return NextResponse.json({
      success: true,
      analysis: {
        bebekStore: bebekStore ? {
          id: bebekStore.id,
          name: bebekStore.name,
          bundlesCount: bebekStore.bundles.length,
          totalOrderItems: bebekStore.bundles.reduce((sum, bundle) => sum + bundle.orderItems.length, 0),
          bundles: bebekStore.bundles.map(bundle => ({
            id: bundle.id,
            name: bundle.name,
            orderItemsCount: bundle.orderItems.length,
            orders: bundle.orderItems.map(item => ({
              orderId: item.order.id,
              orderNumber: item.order.orderNumber,
              status: item.order.orderStatus,
              createdAt: item.order.createdAt.toISOString()
            }))
          }))
        } : null,
        todayOrdersCount: todayOrders.length,
        todayOrdersDetail: todayOrders.map(order => ({
          id: order.id,
          createdAt: order.createdAt.toISOString(),
          stores: [...new Set(order.orderItems.map(item => item.bundle?.store?.name).filter(Boolean))]
        })),
        allOrdersByDate: dateAnalysis,
        dateRange: {
          earliest: allConfirmedWithDates.length > 0 ? allConfirmedWithDates[allConfirmedWithDates.length - 1].createdAt.toISOString() : null,
          latest: allConfirmedWithDates.length > 0 ? allConfirmedWithDates[0].createdAt.toISOString() : null,
          todayStart: startOfDay.toISOString(),
          todayEnd: endOfDay.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('[Debug-Detail] Error:', error);
    return NextResponse.json(
      { 
        error: 'Debug detail query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

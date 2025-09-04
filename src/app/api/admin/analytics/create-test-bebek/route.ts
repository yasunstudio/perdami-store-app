import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[Create-Test-Order] Starting...');
    
    // Find Bebek Si Kembar store
    const bebekStore = await prisma.store.findFirst({
      where: {
        name: {
          contains: 'Bebek',
          mode: 'insensitive'
        }
      },
      include: {
        bundles: true
      }
    });
    
    if (!bebekStore) {
      return NextResponse.json({ error: 'Bebek Si Kembar store not found' }, { status: 404 });
    }
    
    if (bebekStore.bundles.length === 0) {
      return NextResponse.json({ error: 'No bundles found for Bebek Si Kembar' }, { status: 404 });
    }
    
    // Find any user to assign the order to
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      }
    });
    
    if (!testUser) {
      return NextResponse.json({ error: 'No test user found' }, { status: 404 });
    }
    
    // Create test order for today
    const today = new Date();
    
    // Create order for Batch 1 (morning - 11:00)
    const batch1Time = new Date(today);
    batch1Time.setHours(11, 58, 0, 0); // 11:58 AM (Batch 1: 6-18)
    
    const testOrder1 = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}-BEBEK-B1`,
        userId: testUser.id,
        subtotalAmount: 150000,
        serviceFee: 25000,
        totalAmount: 175000,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        pickupMethod: 'VENUE',
        createdAt: batch1Time,
        orderItems: {
          create: [
            {
              bundleId: bebekStore.bundles[0].id,
              quantity: 1,
              unitPrice: 150000,
              totalPrice: 150000
            }
          ]
        }
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
    
    // Create order for Batch 2 (evening - 20:00)  
    const batch2Time = new Date(today);
    batch2Time.setHours(20, 30, 0, 0); // 8:30 PM (Batch 2: 18-6)
    
    const testOrder2 = await prisma.order.create({
      data: {
        orderNumber: `TEST-${Date.now()}-BEBEK-B2`,
        userId: testUser.id,
        subtotalAmount: 200000,
        serviceFee: 25000,
        totalAmount: 225000,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        pickupMethod: 'VENUE',
        createdAt: batch2Time,
        orderItems: {
          create: bebekStore.bundles.slice(0, Math.min(2, bebekStore.bundles.length)).map((bundle, index) => ({
            bundleId: bundle.id,
            quantity: 1,
            unitPrice: 100000,
            totalPrice: 100000
          }))
        }
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
    
    return NextResponse.json({
      success: true,
      message: 'Test orders created for Bebek Si Kembar',
      data: {
        bebekStore: {
          id: bebekStore.id,
          name: bebekStore.name,
          bundlesCount: bebekStore.bundles.length
        },
        testOrders: [
          {
            id: testOrder1.id,
            orderNumber: testOrder1.orderNumber,
            createdAt: testOrder1.createdAt.toISOString(),
            batch: 'Batch 1 (11:58 AM)',
            totalAmount: testOrder1.totalAmount,
            itemsCount: testOrder1.orderItems.length
          },
          {
            id: testOrder2.id,
            orderNumber: testOrder2.orderNumber,
            createdAt: testOrder2.createdAt.toISOString(),
            batch: 'Batch 2 (8:30 PM)',
            totalAmount: testOrder2.totalAmount,
            itemsCount: testOrder2.orderItems.length
          }
        ]
      }
    });
    
  } catch (error) {
    console.error('[Create-Test-Order] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

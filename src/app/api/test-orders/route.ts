import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('📋 Testing orders data loading...');
    
    // Test database connection first
    await prisma.$queryRaw`SELECT 1`;
    
    // Try to get orders count and basic info
    const ordersCount = await prisma.order.count();
    console.log(`Found ${ordersCount} orders in database`);
    
    // Get recent orders (limit 5 for testing)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        orderNumber: true,
        orderStatus: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Orders data loaded successfully!');
    
    return NextResponse.json({
      status: 'success',
      message: 'Orders data loaded successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      data: {
        totalOrders: ordersCount,
        recentOrders
      }
    }, { status: 200 });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Orders loading failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      error_code: error.code,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      troubleshooting: {
        issue: 'Orders data loading failed',
        possibleCause: error.code === 'P2021' ? 'Table does not exist' : 'Database connection issue',
        nextStep: 'Check database schema and run migrations'
      }
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log("👥 Admin users API - Fixed Version");
  
  try {
    // Simple connection test first
    const connectionTest = await prisma.user.count().catch(() => -1);
    if (connectionTest === -1) {
      throw new Error("Database connection failed");
    }

    console.log(`✅ Database connected, ${connectionTest} users found`);

    // Get basic users without complex relations first
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get user-specific data in separate queries
    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        const orderCount = await prisma.order.count({
          where: { userId: user.id }
        }).catch(() => 0);

        return {
          ...user,
          _count: {
            orders: orderCount
          }
        };
      })
    );

    console.log(`✅ Successfully fetched ${usersWithOrderCounts.length} users with order counts`);

    return NextResponse.json({
      success: true,
      data: usersWithOrderCounts,
      total: connectionTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Users API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

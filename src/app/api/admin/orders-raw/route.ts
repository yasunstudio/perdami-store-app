import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  console.log("📊 Admin orders API - Raw Query Version")
  
  try {
    // Use raw query to test connection and avoid prepared statement conflicts
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connected via queryRaw');

    // Get orders with user data using raw query
    const ordersData = await prisma.$queryRaw`
      SELECT 
        o.id, o."orderNumber", o."totalAmount", o."orderStatus", 
        o."paymentStatus", o."createdAt", o."updatedAt", o."userId",
        u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM "Order" o
      LEFT JOIN "User" u ON o."userId" = u.id
      ORDER BY o."createdAt" DESC
      LIMIT 10
    `;

    const orders = (ordersData as any[]).map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: parseFloat(order.totalAmount.toString()),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: {
        id: order.userId,
        name: order.user_name || 'Unknown',
        email: order.user_email || '',
        phone: order.user_phone || ''
      }
    }));

    console.log(`✅ Successfully fetched ${orders.length} orders via raw query`);

    // Get total count using raw query
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM "Order"
    `;
    const total = (countResult as any)[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Orders API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

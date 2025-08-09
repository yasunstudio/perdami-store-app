import { NextRequest, NextResponse } from 'next/server';
import { altPrisma } from '@/lib/prisma-alt';

export async function GET(request: NextRequest) {
  try {
    // Use raw query to avoid prepared statement conflicts
    const users = await altPrisma.$queryRaw`
      SELECT 
        id, name, email, phone, role, image, "emailVerified", "createdAt", "updatedAt",
        COALESCE((
          SELECT COUNT(*)::int 
          FROM "Order" 
          WHERE "userId" = "User".id
        ), 0) as order_count
      FROM "User" 
      ORDER BY "createdAt" DESC
    `;

    const totalResult = await altPrisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM "User"
    `;
    
    const total = (totalResult as any)[0]?.total || 0;

    // Format the results to match expected structure
    const formattedUsers = (users as any[]).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        orders: user.order_count
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      total,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Users API Error:', error);
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

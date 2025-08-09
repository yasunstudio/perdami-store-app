import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all users with basic info
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
        updatedAt: true,
        // Count related records
        _count: {
          select: {
            orders: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.user.count();

    return NextResponse.json({
      success: true,
      data: users,
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

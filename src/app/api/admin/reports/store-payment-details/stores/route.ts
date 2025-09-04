import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      stores
    });

  } catch (error) {
    console.error('Error fetching stores for payment details:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch stores' 
      },
      { status: 500 }
    );
  }
}

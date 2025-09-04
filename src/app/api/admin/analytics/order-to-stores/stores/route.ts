import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Simple fetch all active stores for selection purposes only
    const stores = await prisma.store.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        whatsappNumber: true,
        contactPerson: true,
        isActive: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to simple store data for selector
    const storeData = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.description || '', 
      phone: store.whatsappNumber || '',
      contactPerson: store.contactPerson || '',
      status: store.isActive ? 'active' : 'inactive',
      lastUpdated: store.updatedAt
    }));

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

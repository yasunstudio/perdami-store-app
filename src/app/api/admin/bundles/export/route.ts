import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { store: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get all bundles for export (no pagination)
    const bundles = await prisma.productBundle.findMany({
      where,
      include: {
        store: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      }
    });

    // Import xlsx library dynamically
    const XLSX = await import('xlsx');

    // Prepare data for Excel export
    const exportData = bundles.map((bundle, index) => {
      const profit = bundle.sellingPrice - bundle.costPrice;
      const marginPercent = bundle.costPrice > 0 ? 
        ((profit / bundle.costPrice) * 100).toFixed(1) : '0.0';

      // Format contents/items data
      const itemsData = bundle.contents && Array.isArray(bundle.contents) 
        ? bundle.contents.map((item: any) => `${item.name} (${item.quantity}x)`).join(', ')
        : 'Tidak ada item';

      return {
        'No': index + 1,
        'Nama Bundle': bundle.name,
        'Items': itemsData,
        'Toko': bundle.store.name,
        'Harga Modal (Rp)': bundle.costPrice,
        'Harga Jual (Rp)': bundle.sellingPrice,
        'Profit (Rp)': profit,
        'Margin (%)': `${marginPercent}%`,
        'Status': bundle.isActive ? 'Aktif' : 'Tidak Aktif',
        'Featured': bundle.isFeatured ? 'Ya' : 'Tidak',
        'Tampil ke Customer': bundle.showToCustomer ? 'Ya' : 'Tidak',
        'Deskripsi': bundle.description || '',
        'Dibuat': bundle.createdAt.toLocaleDateString('id-ID'),
        'Diupdate': bundle.updatedAt.toLocaleDateString('id-ID')
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama Bundle
      { wch: 50 },  // Items
      { wch: 20 },  // Toko
      { wch: 15 },  // Harga Modal
      { wch: 15 },  // Harga Jual
      { wch: 15 },  // Profit
      { wch: 10 },  // Margin
      { wch: 12 },  // Status
      { wch: 10 },  // Featured
      { wch: 18 },  // Tampil ke Customer
      { wch: 40 },  // Deskripsi
      { wch: 12 },  // Dibuat
      { wch: 12 }   // Diupdate
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bundle Data');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response with proper headers
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', 'attachment; filename="bundles-export.xlsx"');
    
    return response;

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data' },
      { status: 500 }
    );
  }
}

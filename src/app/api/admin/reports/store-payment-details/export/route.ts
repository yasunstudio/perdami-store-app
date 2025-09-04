import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'excel';

    // Build where clause
    const whereClause: any = {
      orderStatus: 'CONFIRMED', // Only confirmed orders
    };

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Fetch orders with all related data
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          }
        },
        orderItems: {
          include: {
            bundle: {
              include: {
                store: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                  }
                }
              }
            }
          },
          // Filter orderItems by store if storeId is provided
          ...(storeId && {
            where: {
              bundle: {
                storeId: storeId
              }
            }
          })
        }
      },
      orderBy: {
        pickupDate: 'asc'
      }
    });

    // Transform data to flat list of payment details
    const paymentDetails: any[] = [];
    
    orders.forEach(order => {
      // Filter order items by store if specified
      const relevantItems = storeId 
        ? order.orderItems.filter(item => item.bundle?.store?.id === storeId)
        : order.orderItems;

      // Skip orders with no relevant items
      if (relevantItems.length === 0) return;

      relevantItems.forEach(item => {
        if (item.bundle && item.bundle.store) {
          const costPrice = Number(item.bundle.costPrice || 0);
          const totalPrice = costPrice * item.quantity;

          paymentDetails.push({
            'Tanggal Order': order.createdAt.toLocaleDateString('id-ID'),
            'Nama Customer': order.user?.name || 'N/A',
            'No Telepon': order.user?.phone || '-',
            'Nama Item': item.bundle.name,
            'Jumlah': item.quantity,
            'Harga Satuan': costPrice,
            'Total Harga': totalPrice,
            'Catatan': order.notes || '-',
            'Tanggal Pickup': order.pickupDate ? order.pickupDate.toLocaleDateString('id-ID') : '-',
            'Toko': item.bundle.store.name,
            'Order Number': order.orderNumber,
          });
        }
      });
    });

    if (format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(paymentDetails);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Details');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Generate filename
      const storeName = storeId ? `store-${storeId}` : 'all-stores';
      const dateRange = startDate && endDate 
        ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
        : 'all-dates';
      const filename = `store-payment-details_${storeName}_${dateRange}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'pdf') {
      // For now, return a simple text response for PDF
      // You can implement proper PDF generation later using libraries like jsPDF or puppeteer
      const textContent = paymentDetails.map(detail => 
        Object.entries(detail).map(([key, value]) => `${key}: ${value}`).join(', ')
      ).join('\n');

      const storeName = storeId ? `store-${storeId}` : 'all-stores';
      const dateRange = startDate && endDate 
        ? `${new Date(startDate).toISOString().split('T')[0]}_to_${new Date(endDate).toISOString().split('T')[0]}`
        : 'all-dates';
      const filename = `store-payment-details_${storeName}_${dateRange}.txt`;

      return new NextResponse(textContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in store-payment-details export API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

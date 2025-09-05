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
    const batchId = searchParams.get('batchId');
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

    // Batch filter - add time-based filtering to where clause
    if (batchId) {
      const now = new Date();
      let batchStart: Date, batchEnd: Date;

      if (batchId === 'batch_1') {
        // Batch 1: 06:00-18:00
        const baseDate = startDate ? new Date(startDate) : now;
        batchStart = new Date(baseDate);
        batchStart.setHours(6, 0, 0, 0);
        
        const endBaseDate = endDate ? new Date(endDate) : now;
        batchEnd = new Date(endBaseDate);
        batchEnd.setHours(18, 0, 0, 0);

        if (!startDate && !endDate) {
          whereClause.createdAt = {
            gte: batchStart,
            lt: batchEnd
          };
        }
      } else if (batchId === 'batch_2') {
        // Batch 2: 18:00-06:00 (spans two days)
        const baseDate = startDate ? new Date(startDate) : now;
        batchStart = new Date(baseDate);
        batchStart.setHours(18, 0, 0, 0);

        const endBaseDate = endDate ? new Date(endDate) : now;
        batchEnd = new Date(endBaseDate);
        batchEnd.setDate(batchEnd.getDate() + 1);
        batchEnd.setHours(6, 0, 0, 0);

        if (!startDate && !endDate) {
          whereClause.createdAt = {
            gte: batchStart,
            lt: batchEnd
          };
        }
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
              select: {
                id: true,
                name: true,
                contents: true,
                costPrice: true,
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

    // Function to format bundle contents like in frontend
    const formatBundleContents = (contents: any) => {
      if (!contents) return '-';
      try {
        if (typeof contents === 'string') {
          return contents;
        }
        if (Array.isArray(contents)) {
          // Handle array of objects with name and quantity
          return contents.map((item: any) => {
            if (typeof item === 'string') {
              return item;
            }
            if (typeof item === 'object' && item.name) {
              // Format: "Item Name (quantity)" - always show quantity
              const quantity = item.quantity || 1;
              return `${item.name} (${quantity})`;
            }
            return String(item);
          }).join(', ');
        }
        if (typeof contents === 'object') {
          if (contents.items && Array.isArray(contents.items)) {
            return contents.items.map((item: any) => {
              if (typeof item === 'string') {
                return item;
              }
              if (typeof item === 'object' && item.name) {
                const quantity = item.quantity || 1;
                return `${item.name} (${quantity})`;
              }
              return item.name || item.description || String(item);
            }).join(', ');
          }
          return JSON.stringify(contents).replace(/[{}"]/g, '').replace(/,/g, ', ');
        }
        return String(contents);
      } catch {
        return '-';
      }
    };

    // Custom date formatting functions to match frontend
    const formatDate = (date: Date | null): string => {
      if (!date) return '-';
      
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return `${day}-${month}-${year}`;
    };

    const formatDateTime = (date: Date | null): string => {
      if (!date) return '-';
      
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    // Transform data to flat list of payment details
    const paymentDetails: any[] = [];
    
    orders.forEach(order => {
      // Additional batch filtering if both date range and batch are specified
      if (batchId && (startDate || endDate)) {
        const orderHour = new Date(order.createdAt).getHours();
        const orderBatch = orderHour >= 6 && orderHour < 18 ? 'batch_1' : 'batch_2';
        if (orderBatch !== batchId) return;
      }

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

          // Determine batch for display
          const orderHour = new Date(order.createdAt).getHours();
          const batchName = orderHour >= 6 && orderHour < 18 
            ? 'Batch 1 - Siang (06:00-18:00)' 
            : 'Batch 2 - Malam (18:00-06:00)';

          paymentDetails.push({
            'Tanggal Order': formatDateTime(order.createdAt),
            'Nama Customer': order.user?.name || 'N/A',
            'No Telepon': order.user?.phone || '-',
            'Paket': item.bundle.name,
            'Item dalam Paket': formatBundleContents(item.bundle.contents),
            'Jumlah': item.quantity,
            'Harga Satuan': costPrice,
            'Total': totalPrice,
            'Tanggal Pickup': formatDate(order.pickupDate),
          });
        }
      });
    });

    if (format === 'excel') {
      // Get store name for header
      let storeNameForHeader = 'Semua Toko';
      if (storeId && paymentDetails.length > 0) {
        // Get store name from first payment detail
        const storeData = await prisma.store.findUnique({
          where: { id: storeId },
          select: { name: true }
        });
        storeNameForHeader = storeData?.name || `Store ${storeId}`;
      }

      // Format date range for header
      let dateRangeForHeader = 'Semua Tanggal';
      if (startDate && endDate) {
        const startDateFormatted = formatDate(new Date(startDate));
        const endDateFormatted = formatDate(new Date(endDate));
        dateRangeForHeader = `${startDateFormatted} - ${endDateFormatted}`;
      } else if (startDate) {
        dateRangeForHeader = `Mulai ${formatDate(new Date(startDate))}`;
      } else if (endDate) {
        dateRangeForHeader = `Sampai ${formatDate(new Date(endDate))}`;
      }

      // Create worksheet with header information
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['LAPORAN DETAIL ORDER KE TOKO'],
        [''],
        [`Nama Toko: ${storeNameForHeader}`],
        [`Tanggal: ${dateRangeForHeader}`],
        [''],
        // Header row for data
        ['Tanggal Order', 'Nama Customer', 'No Telepon', 'Paket', 'Item dalam Paket', 'Jumlah', 'Harga Satuan', 'Total', 'Tanggal Pickup']
      ]);

      // Add data rows starting from row 7 (index 6)
      XLSX.utils.sheet_add_json(worksheet, paymentDetails, { 
        origin: 'A7',
        skipHeader: true 
      });

      // Set column widths for better readability
      worksheet['!cols'] = [
        { width: 12 }, // Tanggal Order
        { width: 20 }, // Nama Customer
        { width: 15 }, // No Telepon
        { width: 25 }, // Paket
        { width: 50 }, // Item dalam Paket
        { width: 8 },  // Jumlah
        { width: 15 }, // Harga Satuan
        { width: 15 }, // Total
        { width: 12 }  // Tanggal Pickup
      ];

      // Merge cells for title
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } } // Merge title across all columns
      ];

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

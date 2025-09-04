import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface OrderData {
  orderNumber: string;
  storeName: string;
  totalValue: number;
  itemCount: number;
  batchName: string;
  createdAt: string;
  status: string;
  userName: string;
  userEmail: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const template = searchParams.get('template');
    const timestamp = searchParams.get('timestamp');
    const orderCount = searchParams.get('orderCount');
    
    // Get filters from URL if available
    const storeIds = searchParams.get('storeIds')?.split(',').filter(Boolean) || [];
    const batchIds = searchParams.get('batchIds')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!format || !template || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Build the same filter logic as the main export API
    const whereClause: any = {
      orderStatus: 'CONFIRMED'
    };

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        gte: start,
        lte: end
      };
    }

    // Batch filter (if specified)
    if (batchIds.length > 0) {
      const batchConditions = batchIds.map((batchId: string) => {
        const today = new Date();
        
        if (batchId === 'batch_1') {
          // Morning batch: 06:00-18:00
          const batchStart = new Date(today);
          batchStart.setHours(6, 0, 0, 0);
          const batchEnd = new Date(today);
          batchEnd.setHours(18, 0, 0, 0);
          
          return {
            AND: [
              { createdAt: { gte: batchStart } },
              { createdAt: { lt: batchEnd } }
            ]
          };
        } else if (batchId === 'batch_2') {
          // Evening batch: 18:00-06:00 (spans midnight)
          const batchStart = new Date(today);
          batchStart.setHours(18, 0, 0, 0);
          const batchEndTomorrow = new Date(today);
          batchEndTomorrow.setDate(today.getDate() + 1);
          batchEndTomorrow.setHours(6, 0, 0, 0);
          
          return {
            OR: [
              { createdAt: { gte: batchStart } },
              { createdAt: { lt: batchEndTomorrow } }
            ]
          };
        }
        return {};
      });

      if (batchConditions.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({ OR: batchConditions });
      }
    }

    // Store filter (through orderItems -> bundle -> store relationship)
    if (storeIds.length > 0) {
      whereClause.orderItems = {
        some: {
          bundle: {
            storeId: {
              in: storeIds
            }
          }
        }
      };
    }

    let orderData: OrderData[] = [];
    
    try {
      // Fetch filtered orders from database
      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              bundle: {
                include: {
                  store: true
                }
              }
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 500 // Reasonable limit for export
      });

      if (orders.length === 0) {
        return NextResponse.json(
          { error: 'No orders found matching the specified criteria' },
          { status: 404 }
        );
      }

      // Transform data
      orderData = orders.map((order, index) => {
        const store = order.orderItems[0]?.bundle?.store;
        const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate total value based on cost price (what we pay to stores)
        let totalCostValue = 0;
        order.orderItems.forEach(item => {
          if (item.bundle?.costPrice) {
            totalCostValue += Number(item.bundle.costPrice) * item.quantity;
          }
        });
        
        // Determine batch based on creation time
        const createdHour = new Date(order.createdAt).getHours();
        const batchName = createdHour >= 6 && createdHour < 18 
          ? 'Batch 1 (06:00-18:00)' 
          : 'Batch 2 (18:00-06:00)';

        return {
          orderNumber: order.orderNumber || `ORD-${String(index + 1).padStart(3, '0')}`,
          storeName: store?.name || 'Unknown Store',
          totalValue: totalCostValue, // Use cost price total instead of selling price
          itemCount: totalItems,
          batchName,
          createdAt: order.createdAt.toISOString(),
          status: order.orderStatus || 'PENDING',
          userName: order.user?.name || 'Unknown User',
          userEmail: order.user?.email || 'unknown@email.com'
        };
      });

    } catch (dbError) {
      console.error('Database error during export:', dbError);
      return NextResponse.json(
        { error: 'Database error during export. Please try again later.' },
        { status: 500 }
      );
    }

    if (format === 'excel') {
      return generateExcelFile(orderData, template, storeIds, batchIds, startDate, endDate);
    } else if (format === 'pdf') {
      return generatePDFFile(orderData, template, storeIds, batchIds, startDate, endDate);
    } else if (format === 'whatsapp') {
      return generateWhatsAppText(orderData, template);
    } else if (format === 'email') {
      return generateEmailText(orderData, template);
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error generating download file:', error);
    return NextResponse.json(
      { error: 'Failed to generate file' },
      { status: 500 }
    );
  }
}

function generateExcelFile(data: OrderData[], template: string, storeIds: string[], batchIds: string[], startDate: string | null, endDate: string | null) {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create summary worksheet
    const summaryData = [
      ['Order ke Toko Report'],
      ['Generated at:', new Date().toLocaleString('id-ID')],
      ['Template:', template],
      [''],
      ['Summary'],
      ['Total Orders:', data.length],
      ['Total Value:', `Rp ${data.reduce((sum, order) => sum + order.totalValue, 0).toLocaleString('id-ID')}`],
      ['Total Items:', data.reduce((sum, order) => sum + order.itemCount, 0)],
      [''],
      ['Orders by Store:'],
      ...getOrdersByStore(data).map(([store, count, value]) => [store, `${count} orders`, `Rp ${value.toLocaleString('id-ID')}`])
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    // Create detailed orders worksheet
    const orderHeaders = ['Order Number', 'Store Name', 'Total Value', 'Item Count', 'Batch', 'Created At', 'Status'];
    const orderRows = data.map(order => [
      order.orderNumber,
      order.storeName,
      order.totalValue,
      order.itemCount,
      order.batchName,
      new Date(order.createdAt).toLocaleString('id-ID'),
      order.status
    ]);

    const ordersWS = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
    XLSX.utils.book_append_sheet(workbook, ordersWS, 'Orders');

    // Create batch summary worksheet
    const batchSummary = getBatchSummary(data);
    const batchHeaders = ['Batch Name', 'Order Count', 'Total Value', 'Store Count'];
    const batchRows = Object.entries(batchSummary).map(([batch, summary]) => [
      batch,
      summary.orderCount,
      summary.totalValue,
      summary.storeCount
    ]);

    const batchWS = XLSX.utils.aoa_to_sheet([batchHeaders, ...batchRows]);
    XLSX.utils.book_append_sheet(workbook, batchWS, 'Batch Summary');

    // Generate meaningful filename based on filters
    const generateFileName = () => {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      let filename = 'order-to-stores';
      
      // Add date range to filename
      if (startDate && endDate) {
        const start = new Date(startDate).toISOString().split('T')[0];
        const end = new Date(endDate).toISOString().split('T')[0];
        filename += `_${start}_to_${end}`;
      } else {
        filename += `_${dateStr}`;
      }
      
      // Add store filter info
      if (storeIds.length > 0) {
        if (storeIds.length === 1) {
          // Use a generic store identifier since we don't have store data here
          filename += `_1-store`;
        } else {
          filename += `_${storeIds.length}-stores`;
        }
      } else {
        filename += '_all-stores';
      }
      
      // Add batch filter info
      if (batchIds.length > 0) {
        const batchNames = batchIds.map(id => 
          id === 'batch_1' ? 'batch1' : id === 'batch_2' ? 'batch2' : id
        );
        filename += `_${batchNames.join('-')}`;
      } else {
        filename += '_all-batches';
      }
      
      // Add template info
      filename += `_${template}`;
      
      // Add order count
      filename += `_${data.length}orders`;
      
      return `${filename}.xlsx`;
    };

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${generateFileName()}"`
      }
    });

  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw error;
  }
}

function generatePDFFile(data: OrderData[], template: string, storeIds: string[], batchIds: string[], startDate: string | null, endDate: string | null) {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Order ke Toko Report', 20, 20);
    
    // Subtitle
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 20, 30);
    doc.text(`Template: ${template}`, 20, 40);
    
    // Summary section
    doc.setFontSize(14);
    doc.text('Summary', 20, 55);
    
    doc.setFontSize(10);
    doc.text(`Total Orders: ${data.length}`, 20, 65);
    doc.text(`Total Value: Rp ${data.reduce((sum, order) => sum + order.totalValue, 0).toLocaleString('id-ID')}`, 20, 75);
    doc.text(`Total Items: ${data.reduce((sum, order) => sum + order.itemCount, 0)}`, 20, 85);
    
    // Orders table
    const tableData = data.map(order => [
      order.orderNumber,
      order.storeName,
      `Rp ${order.totalValue.toLocaleString('id-ID')}`,
      order.itemCount.toString(),
      order.batchName,
      order.status
    ]);

    doc.autoTable({
      head: [['Order', 'Store', 'Value', 'Items', 'Batch', 'Status']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'center' }
      }
    });

    // Generate filename for PDF
    const generatePDFFileName = () => {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      
      let filename = 'order-to-stores';
      
      if (startDate && endDate) {
        const start = new Date(startDate).toISOString().split('T')[0];
        const end = new Date(endDate).toISOString().split('T')[0];
        filename += `_${start}_to_${end}`;
      } else {
        filename += `_${dateStr}`;
      }
      
      if (storeIds.length > 0) {
        filename += `_${storeIds.length}-stores`;
      } else {
        filename += '_all-stores';
      }
      
      if (batchIds.length > 0) {
        const batchNames = batchIds.map(id => 
          id === 'batch_1' ? 'batch1' : id === 'batch_2' ? 'batch2' : id
        );
        filename += `_${batchNames.join('-')}`;
      } else {
        filename += '_all-batches';
      }
      
      filename += `_${template}_${data.length}orders`;
      
      return `${filename}.pdf`;
    };

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${generatePDFFileName()}"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF file:', error);
    throw error;
  }
}

function generateWhatsAppText(data: OrderData[], template: string) {
  const totalValue = data.reduce((sum, order) => sum + order.totalValue, 0);
  const totalItems = data.reduce((sum, order) => sum + order.itemCount, 0);
  
  let text = `*📊 LAPORAN ORDER KE TOKO*\n`;
  text += `📅 ${new Date().toLocaleDateString('id-ID')}\n\n`;
  text += `*📈 RINGKASAN:*\n`;
  text += `• Total Order: ${data.length}\n`;
  text += `• Total Nilai: Rp ${totalValue.toLocaleString('id-ID')}\n`;
  text += `• Total Item: ${totalItems}\n\n`;
  
  text += `*🏪 DETAIL PER TOKO:*\n`;
  const storeGroups = getOrdersByStore(data);
  storeGroups.forEach(([store, count, value]) => {
    text += `• ${store}: ${count} order (Rp ${value.toLocaleString('id-ID')})\n`;
  });
  
  text += `\n*⏰ DETAIL PER BATCH:*\n`;
  const batchSummary = getBatchSummary(data);
  Object.entries(batchSummary).forEach(([batch, summary]) => {
    text += `• ${batch}: ${summary.orderCount} order (Rp ${summary.totalValue.toLocaleString('id-ID')})\n`;
  });
  
  text += `\n*📋 DAFTAR ORDER:*\n`;
  data.forEach((order, index) => {
    text += `${index + 1}. ${order.orderNumber} - ${order.storeName}\n`;
    text += `   Rp ${order.totalValue.toLocaleString('id-ID')} (${order.itemCount} item)\n`;
  });
  
  text += `\n_Generated by Perdami Store App_`;

  return new NextResponse(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="order-to-stores-whatsapp-${Date.now()}.txt"`
    }
  });
}

function generateEmailText(data: OrderData[], template: string) {
  const totalValue = data.reduce((sum, order) => sum + order.totalValue, 0);
  const totalItems = data.reduce((sum, order) => sum + order.itemCount, 0);
  
  let html = `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #2563eb;">📊 Laporan Order ke Toko</h1>
      <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
      <p><strong>Template:</strong> ${template}</p>
      
      <h2 style="color: #1e40af;">📈 Ringkasan</h2>
      <ul>
        <li><strong>Total Order:</strong> ${data.length}</li>
        <li><strong>Total Nilai:</strong> Rp ${totalValue.toLocaleString('id-ID')}</li>
        <li><strong>Total Item:</strong> ${totalItems}</li>
      </ul>
      
      <h2 style="color: #1e40af;">🏪 Detail per Toko</h2>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead style="background-color: #f3f4f6;">
          <tr>
            <th style="padding: 8px;">Nama Toko</th>
            <th style="padding: 8px;">Jumlah Order</th>
            <th style="padding: 8px;">Total Nilai</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  const storeGroups = getOrdersByStore(data);
  storeGroups.forEach(([store, count, value]) => {
    html += `
      <tr>
        <td style="padding: 8px;">${store}</td>
        <td style="padding: 8px; text-align: center;">${count}</td>
        <td style="padding: 8px; text-align: right;">Rp ${value.toLocaleString('id-ID')}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
      
      <h2 style="color: #1e40af;">📋 Daftar Order</h2>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead style="background-color: #f3f4f6;">
          <tr>
            <th style="padding: 8px;">Order Number</th>
            <th style="padding: 8px;">Toko</th>
            <th style="padding: 8px;">Nilai</th>
            <th style="padding: 8px;">Item</th>
            <th style="padding: 8px;">Batch</th>
            <th style="padding: 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  data.forEach(order => {
    html += `
      <tr>
        <td style="padding: 8px;">${order.orderNumber}</td>
        <td style="padding: 8px;">${order.storeName}</td>
        <td style="padding: 8px; text-align: right;">Rp ${order.totalValue.toLocaleString('id-ID')}</td>
        <td style="padding: 8px; text-align: center;">${order.itemCount}</td>
        <td style="padding: 8px;">${order.batchName}</td>
        <td style="padding: 8px;">${order.status}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
      
      <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
        <em>Generated by Perdami Store App - ${new Date().toLocaleDateString('id-ID')}</em>
      </p>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="order-to-stores-email-${Date.now()}.html"`
    }
  });
}

function getOrdersByStore(data: OrderData[]): [string, number, number][] {
  const storeMap = new Map<string, { count: number; value: number }>();
  
  data.forEach(order => {
    const existing = storeMap.get(order.storeName) || { count: 0, value: 0 };
    storeMap.set(order.storeName, {
      count: existing.count + 1,
      value: existing.value + order.totalValue
    });
  });
  
  return Array.from(storeMap.entries()).map(([store, { count, value }]) => [store, count, value]);
}

function getBatchSummary(data: OrderData[]) {
  const batchMap = new Map<string, { orderCount: number; totalValue: number; storeCount: number }>();
  
  data.forEach(order => {
    const existing = batchMap.get(order.batchName) || { orderCount: 0, totalValue: 0, storeCount: 0 };
    batchMap.set(order.batchName, {
      orderCount: existing.orderCount + 1,
      totalValue: existing.totalValue + order.totalValue,
      storeCount: existing.storeCount // Will be calculated separately
    });
  });
  
  // Calculate unique stores per batch
  batchMap.forEach((summary, batchName) => {
    const storesInBatch = new Set(
      data.filter(order => order.batchName === batchName).map(order => order.storeName)
    );
    summary.storeCount = storesInBatch.size;
  });
  
  return Object.fromEntries(batchMap);
}

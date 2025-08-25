import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Order } from '@/types'

interface ExportOrdersToExcelOptions {
  allOrders: Order[]
  storeOrders: { [key: string]: Order[] }
}

export const exportOrdersToExcel = ({ allOrders, storeOrders }: ExportOrdersToExcelOptions) => {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: All Orders
  const allOrdersData = allOrders.map((order) => ({
    'No. Pesanan': order.orderNumber,
    'Customer': order.user?.name || 'N/A',
    'No. Telp': order.user?.phone || 'N/A',
    'Email': order.user?.email || 'N/A',
    'Jumlah Item': order.items?.length || 0,
    'Item': (order.items || [])
      .map((item) => `${item.bundle.name} (${item.quantity}x)`)
      .join(', '),
    'Subtotal': order.subtotalAmount,
    'Biaya Layanan': order.serviceFee,
    'Total': order.totalAmount,
    'Status Order': order.orderStatus,
    'Status Pembayaran': order.paymentStatus,
    'Tanggal Order': format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id }),
    'Tanggal Pickup': order.pickupDate 
      ? format(new Date(order.pickupDate), 'dd MMM yyyy HH:mm', { locale: id })
      : 'Belum dijadwalkan'
  }))

  const allOrdersSheet = XLSX.utils.json_to_sheet(allOrdersData)
  XLSX.utils.book_append_sheet(workbook, allOrdersSheet, 'Semua Pesanan')

  // Group and calculate store-specific data
  const storeOrdersMap = allOrders.reduce((acc: { [key: string]: any[] }, order) => {
    // Process each order item by store
    order.items?.forEach((item) => {
      if (item.bundle?.store) {
        const storeName = item.bundle.store.name
        if (!acc[storeName]) {
          acc[storeName] = []
        }

        // Calculate item specific totals
        const itemTotal = item.price * item.quantity

        // Add detailed store order entry
        acc[storeName].push({
          orderNumber: order.orderNumber,
          customerName: order.user?.name || 'N/A',
          customerPhone: order.user?.phone || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          itemName: item.bundle.name,
          quantity: item.quantity,
          pricePerUnit: item.price,
          itemTotal: itemTotal,
          serviceFee: order.serviceFee,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          orderDate: order.createdAt,
          pickupDate: order.pickupDate
        })
      }
    })
    return acc
  }, {})

  // Additional sheets for each store
  Object.entries(storeOrdersMap).forEach(([storeName, orderItems]) => {
    const storeOrdersData = orderItems.map((item) => ({
      'No. Pesanan': item.orderNumber,
      'Customer': item.customerName,
      'No. Telp': item.customerPhone,
      'Email': item.customerEmail,
      'Nama Item': item.itemName,
      'Jumlah': item.quantity,
      'Harga Satuan': item.pricePerUnit,
      'Total Item': item.itemTotal,
      'Biaya Layanan': item.serviceFee,
      'Status Order': item.orderStatus,
      'Status Pembayaran': item.paymentStatus,
      'Tanggal Order': format(new Date(item.orderDate), 'dd MMM yyyy HH:mm', { locale: id }),
      'Tanggal Pickup': item.pickupDate 
        ? format(new Date(item.pickupDate), 'dd MMM yyyy HH:mm', { locale: id })
        : 'Belum dijadwalkan'
    }))

    // Calculate summary data
    const summary = {
      totalOrders: new Set(orderItems.map(item => item.orderNumber)).size,
      totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalRevenue: orderItems.reduce((sum, item) => sum + item.itemTotal, 0),
      totalServiceFee: orderItems.reduce((sum, item) => sum + item.serviceFee, 0)
    }

    // Add summary rows at the top
    const summaryData = [
      ['Ringkasan Penjualan'],
      ['Total Pesanan', summary.totalOrders],
      ['Total Item Terjual', summary.totalItems],
      ['Total Pendapatan', summary.totalRevenue],
      ['Total Biaya Layanan', summary.totalServiceFee],
      ['Total Bersih', summary.totalRevenue],
      [''],  // Empty row as separator
    ]

    // Create worksheet and add summary
    const storeSheet = XLSX.utils.aoa_to_sheet(summaryData)
    
    // Add the detailed order data below summary
    XLSX.utils.sheet_add_json(storeSheet, storeOrdersData, { 
      origin: 'A' + (summaryData.length + 1)
    })

    // Set column widths
    const columnWidths = [
      { wch: 15 },  // No. Pesanan
      { wch: 20 },  // Customer
      { wch: 15 },  // No. Telp
      { wch: 25 },  // Email
      { wch: 30 },  // Nama Item
      { wch: 10 },  // Jumlah
      { wch: 15 },  // Harga Satuan
      { wch: 15 },  // Total Item
      { wch: 15 },  // Biaya Layanan
      { wch: 15 },  // Status Order
      { wch: 15 },  // Status Pembayaran
      { wch: 20 },  // Tanggal Order
      { wch: 20 },  // Tanggal Pickup
    ]
    storeSheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, storeSheet, storeName)
  })

  try {
    // Convert workbook to array buffer
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    // Convert array buffer to blob
    const blob = new Blob([wbout], { type: 'application/octet-stream' })

    // Create download link
    const fileName = `orders-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.xlsx`
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()

    // Cleanup
    window.URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export data to Excel file')
  }
}

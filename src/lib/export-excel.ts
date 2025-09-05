import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Order } from '@/types'

interface ExportOrdersToExcelOptions {
  allOrders: Order[]
  storeOrders?: { [key: string]: Order[] } // Make optional since we generate it internally
}

export const exportOrdersToExcel = ({ allOrders, storeOrders }: ExportOrdersToExcelOptions) => {
  try {
    console.log('Starting Excel export...', { 
      allOrdersCount: allOrders?.length,
      version: 'v2.0-improved-format'
    })
    
    if (!allOrders || allOrders.length === 0) {
      throw new Error('No orders data provided for export')
    }

    const workbook = XLSX.utils.book_new()

    // Sheet 1: All Orders (Semua Pesanan)
    const allOrdersData = allOrders.map((order) => {
      const customer = order.user || order.customer || {}
      return {
        'Customer': customer.name || 'N/A',
        'No. Telp': customer.phone || 'N/A',
        'Email': customer.email || 'N/A',
        'Jumlah Item': order.items?.length || 0,
        'Item': (order.items || [])
          .map((item) => item.bundle?.name || 'Unknown')
          .join(', '),
        'Subtotal': order.subtotalAmount || 0,
        'Biaya Layanan': order.serviceFee || 0,
        'Total': order.totalAmount || 0,
        'Status Order': order.orderStatus || 'N/A',
        'Status Pembayaran': order.paymentStatus || 'N/A',
        'Tanggal Order': order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', { locale: id }) : 'N/A',
        'Tanggal Pickup': order.pickupDate 
          ? format(new Date(order.pickupDate), 'dd MMM yyyy HH:mm', { locale: id })
          : 'Belum dijadwalkan',
        'Note': order.notes || ''
      }
    })

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
          const itemPrice = item.price || 0
          const itemTotal = itemPrice * (item.quantity || 0)
          const customer = order.user || order.customer || {}

          // Add detailed store order entry
          acc[storeName].push({
            orderNumber: order.orderNumber || 'N/A',
            customerName: customer.name || 'N/A',
            customerPhone: customer.phone || 'N/A',
            customerEmail: customer.email || 'N/A',
            itemName: item.bundle.name || 'Unknown',
            quantity: item.quantity || 0,
            pricePerUnit: itemPrice,
            itemTotal: itemTotal,
            serviceFee: order.serviceFee || 0,
            orderStatus: order.orderStatus || 'N/A',
            paymentStatus: order.paymentStatus || 'N/A',
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
        'Customer': item.customerName,
        'No. Telp': item.customerPhone,
        'Email': item.customerEmail,
        'Nama Item': item.itemName,
        'Jumlah': item.quantity,
        'Harga Jual (Satuan)': item.pricePerUnit,
        'Jumlah Penjualan': item.itemTotal,
        'Tanggal Order': item.orderDate ? format(new Date(item.orderDate), 'dd MMM yyyy HH:mm', { locale: id }) : 'N/A',
        'Tanggal Pickup': item.pickupDate 
          ? format(new Date(item.pickupDate), 'dd MMM yyyy HH:mm', { locale: id })
          : 'Belum dijadwalkan'
      }))

      // Create worksheet directly with order data (no summary)
      const storeSheet = XLSX.utils.json_to_sheet(storeOrdersData)

      // Set column widths
      const columnWidths = [
        { wch: 20 },  // Customer
        { wch: 15 },  // No. Telp
        { wch: 25 },  // Email
        { wch: 30 },  // Nama Item
        { wch: 10 },  // Jumlah
        { wch: 20 },  // Harga Jual (Satuan)
        { wch: 20 },  // Jumlah Penjualan
        { wch: 20 },  // Tanggal Order
        { wch: 20 },  // Tanggal Pickup
      ]
      storeSheet['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(workbook, storeSheet, storeName)
    })

    // Convert workbook to array buffer
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    // Convert array buffer to blob
    const blob = new Blob([wbout], { type: 'application/octet-stream' })

    // Create download link with timestamp for cache busting
    const timestamp = Date.now()
    const fileName = `orders-export-v2-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}-${timestamp}.xlsx`
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()

    // Cleanup
    window.URL.revokeObjectURL(url)
    console.log('Excel export completed successfully')
    return true
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error(`Failed to export data to Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

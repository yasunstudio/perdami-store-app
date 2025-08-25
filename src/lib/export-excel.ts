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

  // Group orders by store first
  const storeOrdersMap = allOrders.reduce((acc: { [key: string]: Order[] }, order) => {
    // Get all unique stores from order items
    order.items?.forEach((item) => {
      if (item.bundle?.store) {
        const storeName = item.bundle.store.name
        if (!acc[storeName]) {
          acc[storeName] = []
        }
        // Only add order if it hasn't been added for this store
        if (!acc[storeName].find(o => o.id === order.id)) {
          acc[storeName].push(order)
        }
      }
    })
    return acc
  }, {})

  // Additional sheets for each store
  Object.entries(storeOrdersMap).forEach(([storeName, orders]) => {
    const storeOrdersData = orders.map((order) => ({
      'No. Pesanan': order.orderNumber,
      'Customer': order.user?.name || 'N/A',
      'No. Telp': order.user?.phone || 'N/A',
      'Email': order.user?.email || 'N/A',
      'Item': (order.items || [])
        .filter(item => item.bundle?.store?.name === storeName)
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

    const storeSheet = XLSX.utils.json_to_sheet(storeOrdersData)
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

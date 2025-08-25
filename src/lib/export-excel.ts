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
    'Customer': order.user?.name || order.customer?.name || 'N/A',
    'Email': order.user?.email || order.customer?.email || 'N/A',
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

  // Additional sheets for each store
  Object.entries(storeOrders).forEach(([storeName, orders]) => {
    const storeOrdersData = orders.map((order) => ({
      'No. Pesanan': order.orderNumber,
      'Customer': order.user?.name || order.customer?.name || 'N/A',
      'Email': order.user?.email || order.customer?.email || 'N/A',
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

    const storeSheet = XLSX.utils.json_to_sheet(storeOrdersData)
    XLSX.utils.book_append_sheet(workbook, storeSheet, storeName)
  })

  // Save the workbook
  const fileName = `orders-export-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

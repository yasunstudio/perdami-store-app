import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrderStatus, PaymentStatus } from '@/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const orderStatusParam = searchParams.get('orderStatus')
    const paymentStatusParam = searchParams.get('paymentStatus')
    const orderStatus = orderStatusParam && orderStatusParam !== '' ? orderStatusParam as OrderStatus : null
    const paymentStatus = paymentStatusParam && paymentStatusParam !== '' ? paymentStatusParam as PaymentStatus : null
    const exportFormat = searchParams.get('format') || 'excel'
    const includeCustomerInfo = searchParams.get('includeCustomerInfo') === 'true'
    const includeOrderItems = searchParams.get('includeOrderItems') === 'true'
    const includePaymentInfo = searchParams.get('includePaymentInfo') === 'true'

    // Build where clause
    const where: any = {}
    
    if (orderStatus) {
      where.orderStatus = orderStatus
    }
    
    if (paymentStatus) {
      where.payment = {
        status: paymentStatus
      }
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: includeCustomerInfo ? {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        } : false,
        orderItems: {
          include: {
            bundle: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        },
        bank: includePaymentInfo ? {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            accountName: true
          }
        } : false,
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            proofUrl: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    // Prepare data for export
    const exportData = orders.map(order => {
      const baseData: any = {
        'No. Pesanan': order.orderNumber,
        'Status Pesanan': getOrderStatusLabel(order.orderStatus as any),
        'Status Pembayaran': getPaymentStatusLabel(order.payment?.status || 'PENDING' as any),
        'Total Amount': order.totalAmount,
        'Metode Pengambilan': getPickupMethodText(order.pickupMethod),
        'Tanggal Pickup': order.pickupDate ? format(new Date(order.pickupDate), 'dd/MM/yyyy', { locale: id }) : '-',
        'Catatan': order.notes || '-',
        'Tanggal Dibuat': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
        'Tanggal Update': format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm', { locale: id })
      }

      if (includeCustomerInfo && order.user) {
        baseData['Nama Pelanggan'] = order.user.name
        baseData['Email Pelanggan'] = order.user.email
        baseData['Telepon Pelanggan'] = order.user.phone || '-'
      }

      if (includeOrderItems && order.orderItems) {
        const itemsText = order.orderItems.map(item => 
          `${item.bundle?.name || 'Unknown Bundle'} (${item.quantity}x @ ${item.price})`
        ).join('; ')
        baseData['Item Pesanan'] = itemsText
        baseData['Jumlah Item'] = order.orderItems.length
      }

      if (includePaymentInfo) {
        baseData['Metode Pembayaran'] = order.payment?.method || '-'
        if (order.bank) {
          baseData['Bank'] = order.bank.name
          baseData['No. Rekening'] = order.bank.accountNumber
          baseData['Nama Pemilik Rekening'] = order.bank.accountName
        }
        baseData['Bukti Pembayaran'] = order.payment?.proofUrl ? 'Ada' : 'Tidak Ada'
      }

      return baseData
    })

    if (exportFormat === 'csv') {
      // Generate CSV
      const csv = generateCSV(exportData)
      const filename = `orders-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // Generate Excel file
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 15 }, // No. Pesanan
        { wch: 15 }, // Status Pesanan
        { wch: 18 }, // Status Pembayaran
        { wch: 12 }, // Total Amount
        { wch: 15 }, // Metode Pengambilan
        { wch: 12 }, // Tanggal Pickup
        { wch: 30 }, // Catatan
        { wch: 18 }, // Tanggal Dibuat
        { wch: 18 }, // Tanggal Update
      ]
      
      if (includeCustomerInfo) {
        colWidths.push(
          { wch: 20 }, // Nama Pelanggan
          { wch: 25 }, // Email Pelanggan
          { wch: 15 }  // Telepon Pelanggan
        )
      }
      
      if (includeOrderItems) {
        colWidths.push(
          { wch: 50 }, // Item Pesanan
          { wch: 12 }  // Jumlah Item
        )
      }
      
      if (includePaymentInfo) {
        colWidths.push(
          { wch: 18 }, // Metode Pembayaran
          { wch: 15 }, // Bank
          { wch: 18 }, // No. Rekening
          { wch: 25 }, // Nama Pemilik Rekening
          { wch: 15 }  // Bukti Pembayaran
        )
      }
      
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Orders Export')
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      const filename = `orders-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

function getOrderStatusLabel(status: OrderStatus): string {
  const statusLabels = {
    PENDING: 'Menunggu',
    CONFIRMED: 'Dikonfirmasi',
    PROCESSING: 'Diproses',
    READY: 'Siap',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan'
  }
  return statusLabels[status] || status
}

function getPaymentStatusLabel(status: PaymentStatus): string {
  const statusLabels = {
    PENDING: 'Menunggu',
    PAID: 'Dibayar',
    FAILED: 'Gagal',
    REFUNDED: 'Dikembalikan'
  }
  return statusLabels[status] || status
}

function getPickupMethodText(method: string | null): string {
  if (!method) return '-'
  
  const methodMap: Record<string, string> = {
    VENUE: 'Venue PIT PERDAMI 2025'
  }
  return methodMap[method] || method
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id

    // Fetch order details with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            bundle: {
              include: {
                store: true
              }
            }
          }
        },
        bank: true,
        payment: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate HTML content for PDF
    const formatDate = (dateString: Date) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const formatPrice = (amount: number) => {
      return `Rp ${amount.toLocaleString('id-ID')}`
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${order.orderNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .invoice-title { font-size: 20px; font-weight: bold; }
        .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
        .info-box { width: 45%; }
        .info-box h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555; }
        .info-box p { margin: 5px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .table .text-right { text-align: right; }
        .summary { margin-top: 20px; width: 300px; margin-left: auto; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .summary-row.total { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Perdami Store</div>
        <div class="invoice-title">INVOICE</div>
    </div>

    <div class="info-section">
        <div class="info-box">
            <h3>Informasi Pesanan</h3>
            <p><strong>No. Invoice:</strong> ${order.orderNumber}</p>
            <p><strong>Tanggal:</strong> ${formatDate(order.createdAt)}</p>
            <p><strong>Status:</strong> ${order.orderStatus}</p>
            <p><strong>Pembayaran:</strong> ${order.payment?.method || 'Transfer Bank'}</p>
        </div>
        <div class="info-box">
            <h3>Informasi Pelanggan</h3>
            <p><strong>Nama:</strong> ${order.user.name || 'Tidak tersedia'}</p>
            <p><strong>Email:</strong> ${order.user.email}</p>
            ${order.user.phone ? `<p><strong>Telepon:</strong> ${order.user.phone}</p>` : ''}
        </div>
    </div>

    <table class="table">
        <thead>
            <tr>
                <th>Produk</th>
                <th>Toko</th>
                <th class="text-right">Harga</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.orderItems.map(item => `
                <tr>
                    <td>${item.bundle.name}</td>
                    <td>${item.bundle.store.name}</td>
                    <td class="text-right">${formatPrice(item.price)}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${formatPrice(item.price * item.quantity)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>${formatPrice(order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
        </div>
        <div class="summary-row total">
            <span>TOTAL:</span>
            <span>${formatPrice(order.totalAmount)}</span>
        </div>
    </div>

    <div class="footer">
        <p>Terima kasih atas pesanan Anda!</p>
        <p>Invoice ini dibuat secara otomatis oleh sistem Perdami Store</p>
    </div>
</body>
</html>`

    // Return HTML content with PDF headers
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menggenerate PDF' },
      { status: 500 }
    )
  }
}

import jsPDF from 'jspdf'

export interface InvoiceData {
  orderNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  orderDate: string
  orderStatus: string
  paymentStatus: string
  paymentNotes?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    bundleContents?: Array<{
      name: string
      quantity: number
    }>
  }>
  subtotal: number
  serviceFee: number
  total: number
}

export class PDFInvoiceGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = 210 // A4 width in mm
    this.pageHeight = 297 // A4 height in mm
    this.margin = 20
    this.currentY = this.margin
  }

  private addNewPageIfNeeded(height: number): void {
    if (this.currentY + height > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.currentY = this.margin
    }
  }

  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  public generateInvoice(data: InvoiceData): jsPDF {
    // Header
    this.addHeader(data)
    
    // Customer & Order Info
    this.addCustomerInfo(data)
    
    // Items Table
    this.addItemsTable(data)
    
    // Total Section
    this.addTotalSection(data)
    
    // Payment Notes Section
    this.addPaymentNotes(data)
    
    // Footer
    this.addFooter()

    return this.pdf
  }

  private addHeader(data: InvoiceData): void {
    // Company Name
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Dharma Wanita Perdami Jawa Barat', this.pageWidth / 2, this.currentY, { align: 'center' })
    
    this.currentY += 15
    
    // Invoice Title
    this.pdf.setFontSize(18)
    this.pdf.text('INVOICE', this.pageWidth / 2, this.currentY, { align: 'center' })
    
    this.currentY += 10
    
    // Invoice Number
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(`#${data.orderNumber}`, this.pageWidth / 2, this.currentY, { align: 'center' })
    
    this.currentY += 20
    
    // Line separator
    this.pdf.setLineWidth(0.5)
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 15
  }

  private addCustomerInfo(data: InvoiceData): void {
    const startY = this.currentY
    const leftColumnX = this.margin
    const rightColumnX = this.pageWidth / 2 + 10

    // Customer Information
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('CUSTOMER INFORMATION', leftColumnX, this.currentY)
    
    this.currentY += 8
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(`Name: ${data.customerName}`, leftColumnX, this.currentY)
    
    if (data.customerPhone) {
      this.currentY += 6
      this.pdf.text(`Phone: ${data.customerPhone}`, leftColumnX, this.currentY)
    }
    
    if (data.customerEmail) {
      this.currentY += 6
      this.pdf.text(`Email: ${data.customerEmail}`, leftColumnX, this.currentY)
    }

    // Order Information
    this.currentY = startY
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('ORDER DETAILS', rightColumnX, this.currentY)
    
    this.currentY += 8
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(`Date: ${data.orderDate}`, rightColumnX, this.currentY)
    
    this.currentY += 6
    this.pdf.text(`Status: ${data.orderStatus}`, rightColumnX, this.currentY)
    
    this.currentY += 6
    this.pdf.text(`Payment: ${data.paymentStatus}`, rightColumnX, this.currentY)
    
    this.currentY += 20
  }

  private addItemsTable(data: InvoiceData): void {
    this.addNewPageIfNeeded(50)
    
    // Table Headers
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'bold')
    
    const tableStartY = this.currentY
    const colWidths = [80, 20, 30, 40] // Item, Qty, Unit Price, Total
    const colPositions = [
      this.margin,
      this.margin + colWidths[0],
      this.margin + colWidths[0] + colWidths[1],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2]
    ]

    // Draw table header
    this.pdf.rect(this.margin, tableStartY - 5, this.pageWidth - 2 * this.margin, 10)
    this.pdf.text('Item', colPositions[0] + 2, tableStartY)
    this.pdf.text('Qty', colPositions[1] + 2, tableStartY)
    this.pdf.text('Unit Price', colPositions[2] + 2, tableStartY)
    this.pdf.text('Total', colPositions[3] + 2, tableStartY)
    
    this.currentY += 15

    // Table Rows
    this.pdf.setFont('helvetica', 'normal')
    
    data.items.forEach((item, index) => {
      this.addNewPageIfNeeded(20)
      
      const rowY = this.currentY
      
      // Item name
      this.pdf.text(item.name, colPositions[0] + 2, rowY)
      
      // Quantity
      this.pdf.text(item.quantity.toString(), colPositions[1] + 2, rowY)
      
      // Unit Price
      this.pdf.text(this.formatPrice(item.unitPrice), colPositions[2] + 2, rowY)
      
      // Total Price
      this.pdf.text(this.formatPrice(item.totalPrice), colPositions[3] + 2, rowY)
      
      this.currentY += 10
      
      // Bundle contents
      if (item.bundleContents && item.bundleContents.length > 0) {
        this.pdf.setFontSize(8)
        this.pdf.setTextColor(100, 100, 100)
        item.bundleContents.forEach(content => {
          this.addNewPageIfNeeded(5)
          this.pdf.text(`  • ${content.name} (${content.quantity}x)`, colPositions[0] + 5, this.currentY)
          this.currentY += 4
        })
        this.pdf.setFontSize(10)
        this.pdf.setTextColor(0, 0, 0)
        this.currentY += 3
      }
      
      // Draw row border
      this.pdf.setLineWidth(0.1)
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 5
    })
  }

  private addTotalSection(data: InvoiceData): void {
    this.addNewPageIfNeeded(40)
    
    const rightAlign = this.pageWidth - this.margin - 50
    
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    
    // Subtotal
    this.pdf.text('Subtotal:', rightAlign, this.currentY)
    this.pdf.text(this.formatPrice(data.subtotal), this.pageWidth - this.margin, this.currentY, { align: 'right' })
    this.currentY += 8
    
    // Service Fee
    this.pdf.text('Service Fee:', rightAlign, this.currentY)
    this.pdf.text(this.formatPrice(data.serviceFee), this.pageWidth - this.margin, this.currentY, { align: 'right' })
    this.currentY += 8
    
    // Total
    this.pdf.setLineWidth(0.5)
    this.pdf.line(rightAlign, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 8
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(12)
    this.pdf.text('TOTAL:', rightAlign, this.currentY)
    this.pdf.text(this.formatPrice(data.total), this.pageWidth - this.margin, this.currentY, { align: 'right' })
    this.currentY += 15
  }

  private addPaymentNotes(data: InvoiceData): void {
    if (data.paymentNotes) {
      this.addNewPageIfNeeded(40)
      this.currentY += 10

      // Payment Notes Title
      this.pdf.setFontSize(11)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Catatan Pembayaran:', this.margin, this.currentY)
      this.currentY += 8

      // Payment Notes Content
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor(60, 60, 60)
      const splitNotes = this.pdf.splitTextToSize(data.paymentNotes, this.pageWidth - (this.margin * 2))
      splitNotes.forEach((line: string) => {
        this.addNewPageIfNeeded(5)
        this.pdf.text(line, this.margin, this.currentY)
        this.currentY += 5
      })
      this.pdf.setTextColor(0, 0, 0)
    }
  }

  private addFooter(): void {
    this.currentY += 20
    
    // Thank you message
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text('Thank you for your business!', this.pageWidth / 2, this.currentY, { align: 'center' })
    
    this.currentY += 10
    
    // Generation info
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(100, 100, 100)
    const now = new Date()
    const generatedText = `Generated on ${now.toLocaleDateString('id-ID')} at ${now.toLocaleTimeString('id-ID')}`
    this.pdf.text(generatedText, this.pageWidth / 2, this.currentY, { align: 'center' })
  }

  public async downloadPDF(filename: string): Promise<void> {
    this.pdf.save(filename)
  }
}

// Utility function to generate PDF from order data
export async function generateOrderPDF(orderData: any): Promise<void> {
  try {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Generate HTML content with the same format as print invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${orderData.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .invoice-title { font-size: 20px; margin-top: 10px; }
            .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
            .info-box { width: 45%; }
            .info-box h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #555; }
            .info-box p { margin: 5px 0; font-size: 12px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .table th { background-color: #f8f9fa; font-weight: bold; }
            .table .text-right { text-align: right; }
            .summary { margin-top: 20px; width: 300px; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .summary-row.total { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; font-size: 16px; }
            .payment-notes { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #ddd; }
            .payment-notes h3 { font-size: 14px; color: #555; margin-bottom: 8px; }
            .payment-notes p { font-size: 12px; color: #666; white-space: pre-line; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Dharma Wanita Perdami Jawa Barat</div>
            <div class="invoice-title">INVOICE</div>
            <div style="font-size: 12px; margin-top: 10px;">${orderData.orderNumber}</div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Informasi Pesanan</h3>
              <p><strong>No. Invoice:</strong> ${orderData.orderNumber}</p>
              <p><strong>Tanggal:</strong> ${formatDate(orderData.createdAt)}</p>
              <p><strong>Status:</strong> ${orderData.orderStatus}</p>
              <p><strong>Pembayaran:</strong> ${orderData.payment?.method || 'Transfer Bank'}</p>
            </div>
            <div class="info-box">
              <h3>Informasi Pelanggan</h3>
              <p><strong>Nama:</strong> ${orderData.user?.name || 'Tidak tersedia'}</p>
              <p><strong>Email:</strong> ${orderData.user?.email}</p>
              ${orderData.user?.phone ? `<p><strong>Telepon:</strong> ${orderData.user.phone}</p>` : ''}
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
              ${orderData.orderItems.map((item: any) => `
                <tr>
                  <td>${item.bundle?.name || 'Product'}</td>
                  <td>${item.bundle?.store?.name || 'Store'}</td>
                  <td class="text-right">${formatPrice(item.unitPrice)}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatPrice(orderData.subtotalAmount)}</span>
            </div>
            <div class="summary-row">
              <span>Ongkos Kirim:</span>
              <span>${formatPrice(orderData.serviceFee)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span>${formatPrice(orderData.totalAmount)}</span>
            </div>
          </div>

          ${orderData.payment?.notes ? `
          <div class="payment-notes">
            <h3>Catatan Pembayaran:</h3>
            <p>${orderData.payment.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Terima kasih atas pesanan Anda!</p>
            <p>Invoice ini dibuat secara otomatis oleh sistem Dharma Wanita Perdami Jawa Barat</p>
          </div>
        </body>
      </html>
    `

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Tidak dapat membuka jendela print')
    }

    // Write content and prepare for printing
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // User can choose "Save as PDF" from print dialog
      }, 500)
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF invoice')
  }
}

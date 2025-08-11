import jsPDF from 'jspdf'

export interface InvoiceData {
  orderNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  orderDate: string
  orderStatus: string
  paymentStatus: string
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
    
    // Footer
    this.addFooter()

    return this.pdf
  }

  private addHeader(data: InvoiceData): void {
    // Company Name
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Perdami Store', this.pageWidth / 2, this.currentY, { align: 'center' })
    
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
    const invoiceData: InvoiceData = {
      orderNumber: orderData.orderNumber,
      customerName: orderData.user?.name || 'Customer',
      customerPhone: orderData.user?.phone,
      customerEmail: orderData.user?.email,
      orderDate: typeof orderData.createdAt === 'string' 
        ? new Date(orderData.createdAt).toLocaleDateString('id-ID')
        : orderData.createdAt.toLocaleDateString('id-ID'),
      orderStatus: orderData.orderStatus,
      paymentStatus: orderData.paymentStatus,
      items: orderData.orderItems.map((item: any) => {
        const bundleContents = item.bundle?.contents ? 
          (typeof item.bundle.contents === 'string' 
            ? JSON.parse(item.bundle.contents)
            : item.bundle.contents
          ).map((content: any) => ({
            name: content.product?.name || content.name || 'Item',
            quantity: content.quantity || 1
          })) : undefined

        return {
          name: item.bundle?.name || 'Product',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          bundleContents
        }
      }),
      subtotal: orderData.subtotalAmount,
      serviceFee: orderData.serviceFee,
      total: orderData.totalAmount
    }

    const generator = new PDFInvoiceGenerator()
    generator.generateInvoice(invoiceData)
    
    const filename = `Invoice-${orderData.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`
    await generator.downloadPDF(filename)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF invoice')
  }
}

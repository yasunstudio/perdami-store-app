'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Package, ShoppingCart, Store, Download, Printer } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

interface OrderItemsProps {
  order: {
    id: string
    orderNumber: string
    createdAt: string
    orderStatus: string
    paymentStatus: string
    payment?: {
      method: string
    }
    user: {
      name: string | null
      email: string
      phone?: string | null
    }
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    bundle: {
      id: string
      name: string
      price: number
      image?: string | null
      store: {
        id: string
        name: string
      }
    }
  }>
  totalAmount: number
}

export function OrderItems({ order, items, totalAmount }: OrderItemsProps) {
  // Group items by store
  const itemsByStore = items.reduce((acc, item) => {
    const storeId = item.bundle.store.id
    if (!acc[storeId]) {
      acc[storeId] = {
        store: item.bundle.store,
        items: []
      }
    }
    acc[storeId].items.push(item)
    return acc
  }, {} as Record<string, { store: { id: string; name: string }, items: typeof items }>)

  const stores = Object.values(itemsByStore)
  const serviceFeePerStore = 25000 // Fixed service fee per store
  const totalServiceFee = stores.length * serviceFeePerStore
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = 0 // No tax for now
  const shipping = 0 // No shipping for now

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Tidak dapat membuka jendela print. Pastikan popup tidak diblokir.')
      return
    }

    const invoiceHTML = generateInvoiceHTML()
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
    
    toast.success('Invoice berhasil disiapkan untuk print')
  }

  const handleExportPDF = async () => {
    try {
      toast.loading('Menyiapkan PDF...', { id: 'pdf-export' })
      
      // Generate HTML content locally
      const htmlContent = generateInvoiceHTML()
      
      // Open new window with invoice content
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Tidak dapat membuka jendela PDF. Pastikan popup tidak diblokir.', { id: 'pdf-export' })
        return
      }

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load then open print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // The user can choose "Save as PDF" from the print dialog
        }, 500)
      }
      
      toast.success('PDF siap untuk disimpan (pilih "Save as PDF" di dialog print)', { id: 'pdf-export' })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Gagal menyiapkan PDF untuk export', { id: 'pdf-export' })
    }
  }

  const generateInvoiceHTML = () => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${order.orderNumber}</title>
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
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { print-color-adjust: exact; }
              .no-print { display: none; }
            }
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
              ${items.map(item => `
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
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Ongkos Kirim (${stores.length} toko):</span>
              <span>${formatPrice(totalServiceFee)}</span>
            </div>
            <div class="summary-row total">
              <span>TOTAL:</span>
              <span>${formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Terima kasih atas pesanan Anda!</p>
            <p>Invoice ini dibuat secara otomatis oleh sistem Perdami Store</p>
          </div>
        </body>
      </html>
    `
  }

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Package className="h-5 w-5" />
          Item Pesanan ({items.length} item)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Order Items by Store */}
        <div className="space-y-4">
          {stores.map((storeGroup) => {
            const storeSubtotal = storeGroup.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            
            return (
              <Card key={storeGroup.store.id} className="border border-border/50 bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{storeGroup.store.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {storeGroup.items.length} item
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Items in this store */}
                  <div className="space-y-2">
                    {storeGroup.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-2 bg-background rounded-lg border border-border/50">
                        {/* Bundle Image */}
                        <div className="flex-shrink-0">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            {item.bundle.image ? (
                              <Image
                                src={item.bundle.image}
                                alt={item.bundle.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bundle Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-medium text-sm text-foreground">
                                {item.bundle.name}
                              </h4>
                              
                              <div className="text-xs text-muted-foreground">
                                {formatPrice(item.bundle.price)} per paket
                              </div>
                              
                              <div className="text-xs text-muted-foreground italic">
                                Produk dari {item.bundle.store.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Jumlah: <span className="font-medium">{item.quantity}</span>
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-medium text-sm text-foreground">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.quantity} × {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Store Summary */}
                  <div className="space-y-1 bg-muted/30 p-2 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal {storeGroup.store.name}</span>
                      <span className="text-foreground">{formatPrice(storeSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ongkos Kirim</span>
                      <span className="text-foreground">{formatPrice(serviceFeePerStore)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium text-sm">
                      <span>Total {storeGroup.store.name}</span>
                      <span>{formatPrice(storeSubtotal + serviceFeePerStore)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Separator />

        {/* Grand Total Summary */}
        <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-foreground">Ringkasan Total</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal Semua Item</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ongkos Kirim ({stores.length} toko)</span>
              <span className="text-foreground">{formatPrice(totalServiceFee)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full sm:w-auto h-8 text-xs"
            onClick={handlePrintInvoice}
          >
            <Printer className="h-3 w-3" />
            Print Invoice
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full sm:w-auto h-8 text-xs"
            onClick={handleExportPDF}
          >
            <Download className="h-3 w-3" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

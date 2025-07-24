'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, ExternalLink, ShoppingCart, Store, Download, Printer, Eye } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'
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
  const [selectedBundle, setSelectedBundle] = useState<typeof items[0]['bundle'] | null>(null)
  const [showBundleModal, setShowBundleModal] = useState(false)
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = 0 // Assuming no tax for now
  const shipping = 0 // Assuming no shipping for now

  const handleViewBundle = (bundle: typeof items[0]['bundle']) => {
    try {
      // Try to open admin bundle page
      const newWindow = window.open(`/admin/bundles/${bundle.id}`, '_blank')
      
      // Check if the window was blocked or failed to open
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Fallback to modal view
        setSelectedBundle(bundle)
        setShowBundleModal(true)
        toast.info('Popup diblokir. Menampilkan detail bundle di modal.')
      }
    } catch (error) {
      console.error('Error opening bundle page:', error)
      // Fallback to modal view
      setSelectedBundle(bundle)
      setShowBundleModal(true)
      toast.error('Tidak dapat membuka halaman bundle. Menampilkan di modal.')
    }
  }

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
      
      // Create a new window for PDF generation
      const response = await fetch(`/api/admin/orders/${order.id}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Gagal menggenerate PDF')
      }

      const htmlContent = await response.text()
      
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
      toast.error('Gagal mengexport PDF', { id: 'pdf-export' })
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
            ${tax > 0 ? `
              <div class="summary-row">
                <span>Pajak:</span>
                <span>${formatPrice(tax)}</span>
              </div>
            ` : ''}
            ${shipping > 0 ? `
              <div class="summary-row">
                <span>Ongkir:</span>
                <span>${formatPrice(shipping)}</span>
              </div>
            ` : ''}
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
      <CardContent className="space-y-4">
        {/* Order Items List */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              {/* Bundle Image */}
              <div className="flex-shrink-0">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  {item.bundle.image ? (
                    <Image
                      src={item.bundle.image}
                      alt={item.bundle.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Bundle Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground truncate">
                      {item.bundle.name}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="h-3 w-3" />
                      <span>{item.bundle.store?.name || 'Unknown Store'}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(item.bundle.price)} per paket
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleViewBundle(item.bundle)}
                    >
                      <Eye className="h-3 w-3" />
                      Lihat
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Jumlah: <span className="font-medium">{item.quantity}</span>
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-foreground">
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

        {/* Order Summary */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak</span>
              <span className="text-foreground">{formatPrice(tax)}</span>
            </div>
          )}
          
          {shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ongkir</span>
              <span className="text-foreground">{formatPrice(shipping)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={handlePrintInvoice}
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </CardContent>

      {/* Bundle Detail Modal */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Bundle
            </DialogTitle>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="space-y-4">
              {/* Bundle Image */}
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                {selectedBundle.image ? (
                  <Image
                    src={selectedBundle.image}
                    alt={selectedBundle.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Bundle Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{selectedBundle.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Store className="h-4 w-4" />
                    <span>{selectedBundle.store.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Harga:</span>
                  <span className="font-semibold text-lg">{formatPrice(selectedBundle.price)}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/admin/bundles/${selectedBundle.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buka di Tab Baru
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBundleModal(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

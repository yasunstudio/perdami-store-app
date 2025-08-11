'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import { generateOrderPDF } from '@/lib/pdf-generator'

interface InvoiceActionsProps {
  order: any
  isVisible: boolean
}

export function InvoiceActions({ order, isVisible }: InvoiceActionsProps) {
  const handlePrintInvoice = async () => {
    if (!order) {
      toast.error('Data pesanan tidak tersedia')
      return
    }

    try {
      toast.loading('Generating PDF Invoice...', { id: 'pdf-print' })
      
      await generateOrderPDF(order)
      
      toast.success('Invoice PDF berhasil didownload!', { id: 'pdf-print' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Gagal membuat PDF invoice. Silakan coba lagi.', { id: 'pdf-print' })
    }
  }

  if (!isVisible) return null

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
      <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-100 dark:bg-green-800 rounded-lg">
            <Printer className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-green-600 dark:text-green-300" />
          </div>
          <span className="text-xs sm:text-sm lg:text-base">Print Invoice</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
            Invoice siap untuk dicetak atau didownload sebagai PDF berkualitas tinggi.
          </p>
          
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Mobile Layout */}
            <div className="flex justify-center sm:hidden">
              <Button 
                variant="default" 
                size="sm"
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 px-4 h-9 bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4" />
                <span className="text-sm">Print Invoice</span>
              </Button>
            </div>

            {/* Tablet & Desktop Layout */}
            <div className="hidden sm:flex justify-center">
              <Button 
                variant="default" 
                size="sm"
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 px-6 h-9 bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4" />
                <span className="text-sm">Print Invoice</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

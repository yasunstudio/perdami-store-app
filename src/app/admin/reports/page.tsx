'use client'

import { Metadata } from 'next'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { AdvancedAnalytics } from '@/features/admin/analytics/components/advanced-analytics'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ReportsAdminPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Force refresh the page to reload analytics data
      window.location.reload()
    } catch (error) {
      toast.error('Gagal memuat ulang data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Create a simple CSV export of summary data
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const data = await response.json()
      
      // Create CSV content
      const csvContent = [
        'Jenis Data,Nilai',
        `Total Revenue,${data.stats.totalRevenue}`,
        `Total Orders,${data.stats.totalOrders}`,
        `Total Products,${data.stats.totalProducts}`,
        `Total Users,${data.stats.totalUsers}`,
        `Pending Orders,${data.stats.pendingOrders}`,
        `Completed Orders,${data.stats.completedOrders}`,
        '',
        'Recent Orders',
        'Order Number,Customer,Amount,Status,Date',
        ...data.recentOrders.map((order: any) => 
          `${order.orderNumber},${order.customerName},${order.totalAmount},${order.status},${new Date(order.createdAt).toLocaleDateString()}`
        )
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `laporan-perdami-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success('Laporan berhasil diexport')
    } catch (error) {
      toast.error('Gagal mengexport laporan')
    } finally {
      setIsExporting(false)
    }
  }

  const actions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8" 
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Memuat...' : 'Refresh'}
      </Button>
      <Button 
        size="sm" 
        className="h-8"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="h-4 w-4 mr-1" />
        {isExporting ? 'Mengexport...' : 'Export'}
      </Button>
    </div>
  )

  return (
    <AdminPageLayout 
      title="Laporan & Analisis" 
      description="Analisis performa penjualan dan insight bisnis"
      actions={actions}
    >
      <AdvancedAnalytics />
    </AdminPageLayout>
  )
}

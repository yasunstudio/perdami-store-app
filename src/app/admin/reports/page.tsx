'use client'

import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { AdvancedAnalytics } from '@/features/admin/analytics/components/advanced-analytics'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function ReportsAdminPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Trigger re-render AdvancedAnalytics dengan mengubah key
      setRefreshKey(prev => prev + 1)
      
      // Simulasi delay untuk UX yang lebih baik
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Data berhasil dimuat ulang')
    } catch (error) {
      toast.error('Gagal memuat ulang data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Fetch data from multiple endpoints
      const [dashboardResponse, productsResponse, storesResponse] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/products/stats'),
        fetch('/api/admin/stores/stats')
      ])

      if (!dashboardResponse.ok || !productsResponse.ok || !storesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [dashboardData, productsData, storesData] = await Promise.all([
        dashboardResponse.json(),
        productsResponse.json(),
        storesResponse.json()
      ])

      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Summary Statistics
      const summaryData = [
        ['Statistik', 'Nilai'],
        ['Total Revenue', `Rp ${dashboardData.stats.totalRevenue.toLocaleString('id-ID')}`],
        ['Total Orders', dashboardData.stats.totalOrders],
        ['Total Products', dashboardData.stats.totalProducts],
        ['Total Users', dashboardData.stats.totalUsers],
        ['Pending Orders', dashboardData.stats.pendingOrders],
        ['Completed Orders', dashboardData.stats.completedOrders],
        ['User Growth Rate', `${dashboardData.stats.userGrowthRate}%`],
        ['Product Growth Rate', `${dashboardData.stats.productGrowthRate}%`],
        ['Order Growth Rate', `${dashboardData.stats.orderGrowthRate}%`]
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

      // Sheet 2: Recent Orders
      const ordersData = [
        ['No Order', 'Customer', 'Email', 'Total Amount', 'Status', 'Payment Status', 'Items', 'Tanggal'],
        ...dashboardData.recentOrders.map((order: any) => [
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          `Rp ${order.totalAmount.toLocaleString('id-ID')}`,
          order.status,
          order.paymentStatus,
          order.itemCount,
          new Date(order.createdAt).toLocaleDateString('id-ID')
        ])
      ]
      const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData)
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Order Terbaru')

      // Sheet 3: Popular Products
      const productsDataSheet = [
        ['Nama Bundle', 'Harga', 'Toko', 'Total Terjual', 'Revenue', 'Featured'],
        ...dashboardData.popularProducts.map((product: any) => [
          product.name,
          `Rp ${product.price.toLocaleString('id-ID')}`,
          product.storeName,
          product.totalSold,
          `Rp ${product.revenue.toLocaleString('id-ID')}`,
          product.isFeatured ? 'Ya' : 'Tidak'
        ])
      ]
      const productsSheet = XLSX.utils.aoa_to_sheet(productsDataSheet)
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produk Populer')

      // Sheet 4: Top Selling Bundles (from products API)
      if (productsData.topSellingProducts && productsData.topSellingProducts.length > 0) {
        const topBundlesData = [
          ['Nama Bundle', 'Harga', 'Toko', 'Total Orders', 'Total Revenue', 'Status'],
          ...productsData.topSellingProducts.map((bundle: any) => [
            bundle.name,
            `Rp ${(bundle.price || bundle.sellingPrice || 0).toLocaleString('id-ID')}`,
            bundle.storeName,
            bundle.totalOrders,
            `Rp ${bundle.totalRevenue.toLocaleString('id-ID')}`,
            bundle.isActive ? 'Aktif' : 'Tidak Aktif'
          ])
        ]
        const topBundlesSheet = XLSX.utils.aoa_to_sheet(topBundlesData)
        XLSX.utils.book_append_sheet(workbook, topBundlesSheet, 'Bundle Terlaris')
      }

      // Sheet 5: Store Statistics
      if (storesData.topStoresByBundles && storesData.topStoresByBundles.length > 0) {
        const storeStatsData = [
          ['Nama Toko', 'Total Bundles', 'Active Bundles', 'Status', 'Tanggal Dibuat'],
          ...storesData.topStoresByBundles.map((store: any) => [
            store.name,
            store.totalBundles,
            store.activeBundles,
            store.isActive ? 'Aktif' : 'Tidak Aktif',
            new Date(store.createdAt).toLocaleDateString('id-ID')
          ])
        ]
        const storeStatsSheet = XLSX.utils.aoa_to_sheet(storeStatsData)
        XLSX.utils.book_append_sheet(workbook, storeStatsSheet, 'Statistik Toko')
      }

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0]
      const filename = `laporan-perdami-${currentDate}.xlsx`

      // Write and download file
      XLSX.writeFile(workbook, filename)
      
      toast.success('Laporan Excel berhasil diexport')
    } catch (error) {
      console.error('Export error:', error)
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
      <AdvancedAnalytics key={refreshKey} />
    </AdminPageLayout>
  )
}

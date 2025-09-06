'use client'

import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { AdvancedAnalytics } from '@/features/admin/analytics/components/advanced-analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, RefreshCw, FileText, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
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
        ['LAPORAN ANALITIK & OVERVIEW'],
        [''],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        [''],
        ['RINGKASAN STATISTIK'],
        ['Metrik', 'Nilai'],
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
        ['PESANAN TERBARU'],
        [''],
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
        ['PRODUK POPULER'],
        [''],
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

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `Laporan_Analitik_Overview_${dateStr}.xlsx`

      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success('Laporan Excel berhasil diexport')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengexport laporan')
    } finally {
      setIsExporting(false)
    }
  }

  const reportTypes = [
    {
      title: 'Laporan Penjualan',
      description: 'Analisis lengkap data penjualan dan performa produk',
      icon: TrendingUp,
      href: '/admin/reports/sales',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Laporan Pembelian',
      description: 'Analisis perilaku pembelian pelanggan dan tren transaksi',
      icon: ShoppingCart,
      href: '/admin/reports/purchases',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Laporan Rugi Laba',
      description: 'Analisis profitabilitas dan performa keuangan bisnis',
      icon: DollarSign,
      href: '/admin/reports/profit-loss',
      color: 'from-purple-500 to-purple-600'
    }
  ]

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
        <Download className={`h-4 w-4 mr-1 ${isExporting ? 'animate-pulse' : ''}`} />
        {isExporting ? 'Mengexport...' : 'Export'}
      </Button>
    </div>
  )

  return (
    <AdminPageLayout 
      title="Analitik & Laporan" 
      description="Analisis performa penjualan dan insight bisnis komprehensif"
      actions={actions}
    >
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics & Grafik</TabsTrigger>
          <TabsTrigger value="detailed">Laporan Detail</TabsTrigger>
          <TabsTrigger value="overview">Info & Panduan</TabsTrigger>
        </TabsList>

        {/* Tab 1: Analytics dengan Grafik */}
        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics key={refreshKey} />
        </TabsContent>

        {/* Tab 2: Detailed Reports */}
        <TabsContent value="detailed" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
              Laporan Detail
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Akses laporan detail dengan filter dan export Excel untuk analisis mendalam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const IconComponent = report.icon
              return (
                <Link key={report.href} href={report.href}>
                  <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${report.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FileText className="h-4 w-4 mr-2" />
                        Lihat Laporan
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Info & Panduan */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Sistem Laporan</CardTitle>
              <CardDescription>
                Panduan lengkap untuk menggunakan sistem analitik dan laporan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Fitur Analytics:</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Grafik real-time penjualan 7 hari terakhir</li>
                    <li>• Chart distribusi produk dan toko</li>
                    <li>• Trend analysis dengan growth metrics</li>
                    <li>• Interactive charts dengan tooltips</li>
                    <li>• Auto-refresh data setiap 5 menit</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Fitur Laporan:</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Filter berdasarkan rentang tanggal</li>
                    <li>• Filter berdasarkan toko spesifik</li>
                    <li>• Export data ke Excel (XLSX)</li>
                    <li>• Multi-sheet export dengan breakdown</li>
                    <li>• Format currency dan date Indonesia</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Data Real-time:</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Semua data langsung dari database</li>
                    <li>• Update otomatis setiap refresh</li>
                    <li>• Perhitungan akurat dan real-time</li>
                    <li>• Dukungan tema dark/light mode</li>
                    <li>• Responsive design untuk mobile</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Tips Penggunaan:</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Gunakan filter tanggal untuk analisis spesifik</li>
                    <li>• Export laporan untuk presentasi</li>
                    <li>• Monitor trend untuk insight bisnis</li>
                    <li>• Refresh data untuk informasi terbaru</li>
                    <li>• Gunakan tooltips untuk detail data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  )
}
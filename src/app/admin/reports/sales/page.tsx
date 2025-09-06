'use client'

import { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { ReportLayout } from '@/features/admin/reports/components/report-layout'
import { ReportFilters } from '@/features/admin/reports/components/report-filters'
import { MetricCard, MetricsGrid } from '@/features/admin/reports/components/metric-card'
import { SimpleChart } from '@/features/admin/reports/components/simple-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import type { DateRange, ReportFilters as IReportFilters, SalesReportData } from '@/features/admin/reports/types/index'
import { getDefaultDateRange, formatCurrency, formatNumber, buildReportFilters } from '@/features/admin/reports/utils/index'

export default function SalesReportPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<SalesReportData | null>(null)
  const [filters, setFilters] = useState<IReportFilters>({
    dateRange: getDefaultDateRange()
  })
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/admin/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const fetchReportData = async () => {
    setIsLoading(true)
    try {
      const params = buildReportFilters(filters)
      const response = await fetch(`/api/admin/reports/sales?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales report')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching sales report:', error)
      toast.error('Gagal memuat data laporan penjualan')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [filters])

  const handleRefresh = () => {
    fetchReportData()
  }

  const handleExport = async () => {
    if (!reportData) {
      toast.error('Tidak ada data untuk di-export')
      return
    }

    setIsExporting(true)
    try {
      // Import XLSX dinamically untuk mengurangi bundle size
      const XLSX = await import('xlsx')
      
      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Summary Statistics
      const summaryData = [
        ['LAPORAN PENJUALAN'],
        [''],
        ['Periode', `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        [''],
        ['RINGKASAN PENJUALAN'],
        ['Metrik', 'Nilai'],
        ['Total Penjualan', formatCurrency(reportData.totalSales)],
        ['Total Pesanan', reportData.totalOrders.toString()],
        ['Rata-rata Nilai Pesanan', formatCurrency(reportData.averageOrderValue)],
        ['Total Produk Terjual', reportData.topProducts.reduce((sum, p) => sum + p.quantity, 0).toString()],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

      // Sheet 2: Top Products
      if (reportData.topProducts.length > 0) {
        const productsData = [
          ['PRODUK TERLARIS'],
          [''],
          ['Ranking', 'Nama Produk', 'Qty Terjual', 'Total Revenue'],
          ...reportData.topProducts.map((product, index) => [
            (index + 1).toString(),
            product.name,
            product.quantity.toString(),
            formatCurrency(product.revenue)
          ])
        ]
        const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produk Terlaris')
      }

      // Sheet 3: Sales by Store
      if (reportData.salesByStore.length > 0) {
        const storesData = [
          ['PENJUALAN PER TOKO'],
          [''],
          ['Ranking', 'Nama Toko', 'Total Penjualan', 'Jumlah Pesanan'],
          ...reportData.salesByStore.map((store, index) => [
            (index + 1).toString(),
            store.storeName,
            formatCurrency(store.sales),
            store.orders.toString()
          ])
        ]
        const storesSheet = XLSX.utils.aoa_to_sheet(storesData)
        XLSX.utils.book_append_sheet(workbook, storesSheet, 'Penjualan per Toko')
      }

      // Sheet 4: Daily Sales Trend
      if (reportData.salesByDay.length > 0) {
        const dailyData = [
          ['TREN PENJUALAN HARIAN'],
          [''],
          ['Tanggal', 'Total Penjualan', 'Jumlah Pesanan', 'Rata-rata per Pesanan'],
          ...reportData.salesByDay.map((day) => [
            day.date,
            formatCurrency(day.sales),
            day.orders.toString(),
            formatCurrency(day.orders > 0 ? day.sales / day.orders : 0)
          ])
        ]
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Tren Harian')
      }

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `Laporan_Penjualan_${dateStr}.xlsx`

      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success('Laporan berhasil di-export ke Excel')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal export laporan')
    } finally {
      setIsExporting(false)
    }
  }

  const chartData = reportData?.salesByDay.map(item => ({
    name: item.date,
    value: item.sales,
    label: `${item.orders} pesanan`
  })) || []

  const topProductsChart = reportData?.topProducts.slice(0, 5).map(item => ({
    name: item.name,
    value: item.revenue
  })) || []

  const storeChart = reportData?.salesByStore.slice(0, 5).map(item => ({
    name: item.storeName,
    value: item.sales
  })) || []

  return (
    <AdminPageLayout title="Laporan Penjualan">
      <ReportLayout
        description="Analisis lengkap data penjualan dan performa produk"
        isLoading={isLoading}
        isExporting={isExporting}
        onRefresh={handleRefresh}
        onExport={handleExport}
        badges={reportData ? [
          { label: 'Total Pesanan', value: reportData.totalOrders },
        ] : []}
        filters={
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            showStoreFilter={true}
            stores={stores}
          />
        }
      >
        {reportData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <MetricsGrid columns={4}>
              <MetricCard
                title="Total Penjualan"
                value={reportData.totalSales}
                format="currency"
                icon={DollarSign}
                description="Total revenue dari semua penjualan"
              />
              <MetricCard
                title="Total Pesanan"
                value={reportData.totalOrders}
                format="number"
                icon={ShoppingCart}
                description="Jumlah pesanan yang telah selesai"
              />
              <MetricCard
                title="Rata-rata Nilai Pesanan"
                value={reportData.averageOrderValue}
                format="currency"
                icon={TrendingUp}
                description="AOV (Average Order Value)"
              />
              <MetricCard
                title="Produk Terjual"
                value={reportData.topProducts.reduce((sum, p) => sum + p.quantity, 0)}
                format="number"
                icon={BarChart3}
                description="Total item yang terjual"
              />
            </MetricsGrid>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Tren Penjualan Harian"
                description="Penjualan per hari dalam periode yang dipilih"
                data={chartData}
                type="bar"
                formatValue="currency"
                height={300}
              />
              <SimpleChart
                title="Top 5 Produk Terlaris"
                description="Produk dengan revenue tertinggi"
                data={topProductsChart}
                type="pie"
                formatValue="currency"
                height={300}
              />
            </div>

            {/* Store Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performa Penjualan per Toko</CardTitle>
                <CardDescription>
                  Ranking toko berdasarkan total penjualan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleChart
                    title="Top 5 Toko"
                    data={storeChart}
                    type="bar"
                    formatValue="currency"
                    height={250}
                  />
                  <div className="space-y-3">
                    {reportData.salesByStore.slice(0, 10).map((store, index) => (
                      <div key={store.storeId} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {store.storeName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {store.orders} pesanan
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(store.sales)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produk Terlaris</CardTitle>
                <CardDescription>
                  Daftar produk dengan performa penjualan terbaik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="text-right">Qty Terjual</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Badge variant="outline">{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(product.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </ReportLayout>
    </AdminPageLayout>
  )
}

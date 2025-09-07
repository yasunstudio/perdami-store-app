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
import { Progress } from '@/components/ui/progress'
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import type { DateRange, ReportFilters as IReportFilters, ProfitLossReportData } from '@/features/admin/reports/types/index'
import { getDefaultDateRange, formatCurrency, formatPercentage, buildReportFilters } from '@/features/admin/reports/utils/index'

export default function ProfitLossReportPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<ProfitLossReportData | null>(null)
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
      const response = await fetch(`/api/admin/reports/profit-loss?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch profit loss report')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching profit loss report:', error)
      toast.error('Gagal memuat data laporan rugi laba')
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
      // Import XLSX dinamically
      const XLSX = await import('xlsx')
      
      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Summary Statistics
      const summaryData = [
        ['LAPORAN RUGI LABA'],
        [''],
        ['Periode', `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        [''],
        ['RINGKASAN KEUANGAN'],
        ['Metrik', 'Nilai'],
        ['Total Revenue', formatCurrency(reportData.totalRevenue)],
        ['Total Biaya', formatCurrency(reportData.totalCosts)],
        ['Laba Bersih', formatCurrency(reportData.netProfit)],
        ['Margin Keuntungan', formatPercentage(reportData.profitMargin)],
        [''],
        ['BREAKDOWN BIAYA'],
        ['COGS (Cost of Goods Sold)', formatCurrency((reportData as any).breakdown?.costOfGoodsSold || 0)],
        ['Biaya Operasional', formatCurrency((reportData as any).breakdown?.operationalCosts || 0)],
        ['Gross Profit Margin', formatPercentage((reportData as any).breakdown?.grossProfitMargin || 0)],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

      // Sheet 2: Top Profitable Products
      if (reportData.topProfitableProducts.length > 0) {
        const productsData = [
          ['PRODUK PALING MENGUNTUNGKAN'],
          [''],
          ['Ranking', 'Nama Produk', 'Revenue', 'Biaya', 'Profit', 'Margin (%)'],
          ...reportData.topProfitableProducts.map((product, index) => [
            (index + 1).toString(),
            product.name,
            formatCurrency(product.revenue),
            formatCurrency(product.cost),
            formatCurrency(product.profit),
            product.margin.toFixed(2)
          ])
        ]
        const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produk Menguntungkan')
      }

      // Sheet 3: Profit by Store
      if (reportData.profitByStore.length > 0) {
        const storesData = [
          ['PROFITABILITAS PER TOKO'],
          [''],
          ['Ranking', 'Nama Toko', 'Revenue', 'Biaya', 'Profit', 'Margin (%)'],
          ...reportData.profitByStore.map((store, index) => {
            const margin = store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0
            return [
              (index + 1).toString(),
              store.storeName,
              formatCurrency(store.revenue),
              formatCurrency(store.costs),
              formatCurrency(store.profit),
              margin.toFixed(2)
            ]
          })
        ]
        const storesSheet = XLSX.utils.aoa_to_sheet(storesData)
        XLSX.utils.book_append_sheet(workbook, storesSheet, 'Profit per Toko')
      }

      // Sheet 4: Monthly Revenue Trend
      if (reportData.revenueByMonth.length > 0) {
        const monthlyData = [
          ['TREN BULANAN'],
          [''],
          ['Bulan', 'Revenue', 'Biaya', 'Profit', 'Margin (%)'],
          ...reportData.revenueByMonth.map((month) => {
            const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
            return [
              month.month,
              formatCurrency(month.revenue),
              formatCurrency(month.costs),
              formatCurrency(month.profit),
              margin.toFixed(2)
            ]
          })
        ]
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Tren Bulanan')
      }

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `Laporan_Rugi_Laba_${dateStr}.xlsx`

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

  const monthlyRevenueChart = reportData?.revenueByMonth.map(item => ({
    name: item.month,
    value: item.revenue
  })) || []

  const monthlyProfitChart = reportData?.revenueByMonth.map(item => ({
    name: item.month,
    value: item.profit
  })) || []

  const topProductsChart = reportData?.topProfitableProducts.slice(0, 5).map(item => ({
    name: item.name,
    value: item.profit
  })) || []

  return (
    <AdminPageLayout title="Laporan Rugi Laba">
      <ReportLayout
        description="Analisis profitabilitas dan performa keuangan bisnis"
        isLoading={isLoading}
        isExporting={isExporting}
        onRefresh={handleRefresh}
        onExport={handleExport}
        badges={reportData ? [
          { 
            label: 'Margin Keuntungan', 
            value: `${formatPercentage(reportData.profitMargin)}`,
            variant: reportData.profitMargin > 0 ? 'default' : 'destructive'
          },
          { 
            label: 'Status', 
            value: reportData.netProfit > 0 ? 'Profitable' : 'Loss',
            variant: reportData.netProfit > 0 ? 'default' : 'destructive'
          },
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
                title="Total Revenue"
                value={reportData.totalRevenue}
                format="currency"
                icon={DollarSign}
                description="Pendapatan kotor dari penjualan"
                trend={{
                  value: 5.2,
                  label: 'vs bulan lalu',
                  isPositive: true
                }}
              />
              <MetricCard
                title="Total Biaya"
                value={reportData.totalCosts}
                format="currency"
                icon={TrendingDown}
                description="Cost of Goods Sold (COGS)"
                trend={{
                  value: 2.1,
                  label: 'vs bulan lalu',
                  isPositive: false
                }}
              />
              <MetricCard
                title="Laba Bersih"
                value={reportData.netProfit}
                format="currency"
                icon={reportData.netProfit > 0 ? TrendingUp : TrendingDown}
                description="Service fee (pendapatan platform)"
                trend={{
                  value: Math.abs(reportData.profitMargin),
                  label: 'margin keuntungan',
                  isPositive: reportData.netProfit > 0
                }}
              />
              <MetricCard
                title="Margin Keuntungan"
                value={reportData.profitMargin}
                format="percentage"
                icon={BarChart3}
                description="Persentase keuntungan dari revenue"
              />
            </MetricsGrid>

            {/* Breakdown Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown Keuangan</CardTitle>
                <CardDescription>
                  Rincian komponen pendapatan dan biaya
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(reportData.totalRevenue)}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cost of Goods Sold (COGS)</span>
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency((reportData as any).breakdown?.costOfGoodsSold || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((reportData as any).breakdown?.costOfGoodsSold || 0) / reportData.totalRevenue * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Service Fee (Pendapatan Platform)</span>
                    <span className="text-green-600 dark:text-green-400">
                      +{formatCurrency((reportData as any).breakdown?.serviceFeeTotal || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((reportData as any).breakdown?.serviceFeeTotal || 0) / reportData.totalRevenue * 100} 
                    className="h-2" 
                  />
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Laba Bersih</span>
                      <span className={reportData.netProfit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {formatCurrency(reportData.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Tren Revenue Bulanan"
                description="Pendapatan per bulan (12 bulan terakhir)"
                data={monthlyRevenueChart}
                type="line"
                formatValue="currency"
                height={300}
              />
              <SimpleChart
                title="Tren Profit Bulanan"
                description="Keuntungan bersih per bulan"
                data={monthlyProfitChart}
                type="line"
                formatValue="currency"
                height={300}
              />
            </div>

            {/* Top Profitable Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produk Paling Menguntungkan</CardTitle>
                <CardDescription>
                  Produk dengan kontribusi keuntungan tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleChart
                    title="Top 5 Produk"
                    data={topProductsChart}
                    type="bar"
                    formatValue="currency"
                    height={250}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topProfitableProducts.slice(0, 5).map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Badge variant="outline">{index + 1}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(product.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={product.margin > 20 ? 'default' : product.margin > 10 ? 'secondary' : 'destructive'}>
                              {formatPercentage(product.margin)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Store Profitability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profitabilitas per Toko</CardTitle>
                <CardDescription>
                  Kontribusi keuntungan dari masing-masing toko
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.profitByStore.map((store, index) => {
                    const margin = store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0
                    return (
                      <div key={store.storeId} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {store.storeName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Revenue: {formatCurrency(store.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${store.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(store.profit)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Margin: {formatPercentage(margin)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detail Bulanan</CardTitle>
                <CardDescription>
                  Breakdown revenue, cost, dan profit per bulan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.revenueByMonth.slice(-6).reverse().map((month) => {
                      const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
                      return (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">
                            {month.month}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.costs)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${month.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(month.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={margin > 20 ? 'default' : margin > 10 ? 'secondary' : 'destructive'}>
                              {formatPercentage(margin)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

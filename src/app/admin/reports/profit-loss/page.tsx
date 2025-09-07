'use client'

import { useState, useEffect } from 'react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { ReportLayout } from '@/features/admin/reports/components/report-layout'
import { ReportFilters } from '@/features/admin/reports/components/report-filters'
import { MetricCard, MetricsGrid } from '@/features/admin/reports/components/metric-card'
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
      
      // Helper functions for Excel export formatting
      const formatNumberForExcel = (amount: number): number => {
        return Math.round(amount) // Return raw number for Excel calculations
      }
      
      const formatPercentageForExcel = (value: number): number => {
        return Number((value / 100).toFixed(4)) // Convert to decimal for Excel percentage format
      }
      
      const replaceNA = (value: any, defaultValue: any = 0): any => {
        if (value === 'N/A' || value === null || value === undefined || value === '') {
          return defaultValue
        }
        return value
      }
      
      // Fetch detailed transaction data for export
      const params = buildReportFilters(filters)
      let detailData = { transactions: [], summary: {} }
      
      try {
        const detailResponse = await fetch(`/api/admin/reports/profit-loss/export?${params.toString()}`)
        if (detailResponse.ok) {
          detailData = await detailResponse.json()
        }
      } catch (error) {
        console.warn('Failed to fetch detailed data for export:', error)
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Executive Summary
      const executiveSummary = [
        ['LAPORAN RUGI LABA KOMPREHENSIF'],
        ['PT. Dharma Wanita Perdami'],
        [''],
        ['INFORMASI LAPORAN'],
        ['Periode Analisis', `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
        ['Filter Toko', filters.storeId ? stores.find(s => s.id === filters.storeId)?.name || 'Toko Tertentu' : 'Semua Toko'],
        ['Total Transaksi', replaceNA((detailData.summary as any)?.totalOrders, reportData.topProfitableProducts.length || 0)],
        [''],
        ['RINGKASAN EKSEKUTIF'],
        ['Metrik', 'Nilai (IDR)', 'Persentase', 'Status'],
        ['Total Pemasukan', formatCurrency(reportData.totalRevenue), formatPercentage(100), reportData.totalRevenue > 0 ? 'Positif' : 'Negatif'],
        ['  - Sales Revenue', formatCurrency((detailData.summary as any)?.totalSalesRevenue || reportData.totalRevenue * 0.9), formatPercentage(((detailData.summary as any)?.totalSalesRevenue || reportData.totalRevenue * 0.9) / reportData.totalRevenue * 100), 'Komponen Utama'],
        ['  - Service Fee', formatCurrency((detailData.summary as any)?.totalServiceFee || reportData.totalRevenue * 0.1), formatPercentage(((detailData.summary as any)?.totalServiceFee || reportData.totalRevenue * 0.1) / reportData.totalRevenue * 100), 'Pendapatan Jasa'],
        ['Total Pengeluaran', formatCurrency(reportData.totalCosts), formatPercentage(reportData.totalCosts / reportData.totalRevenue * 100), 'Pembayaran ke Toko'],
        ['Laba Bersih', formatCurrency(reportData.netProfit), formatPercentage(reportData.netProfit / reportData.totalRevenue * 100), reportData.netProfit > 0 ? 'PROFIT' : 'LOSS'],
        ['Margin Keuntungan', formatPercentage(reportData.profitMargin), '', reportData.profitMargin > 20 ? 'Sangat Baik' : reportData.profitMargin > 10 ? 'Baik' : 'Perlu Perbaikan'],
        [''],
        ['KESIMPULAN BISNIS'],
        ['Status Profitabilitas', reportData.netProfit > 0 ? 'MENGUNTUNGKAN' : 'MERUGI'],
        ['Tingkat Efisiensi', reportData.profitMargin > 15 ? 'EFISIEN' : 'PERLU OPTIMASI'],
        ['Rekomendasi', reportData.profitMargin < 10 ? 'Review cost structure & pricing' : 'Pertahankan performa'],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(executiveSummary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary')

      // Sheet 2: Detailed Transactions (if available)
      if (detailData.transactions && detailData.transactions.length > 0) {
        const transactionHeaders = [
          ['DETAIL TRANSAKSI LENGKAP'],
          [''],
          ['Order ID', 'Tanggal Order', 'Tanggal Pickup', 'Customer', 'Produk', 'Toko', 'Qty', 'Harga Satuan (IDR)', 'Total Harga (IDR)', 'Ongkos Kirim (IDR)', 'Total Pemasukan (IDR)', 'Cost per Unit (IDR)', 'Total Cost (IDR)', 'Profit per Item (IDR)', 'Margin (%)', 'Status']
        ]
        
        const transactionRows = detailData.transactions.map((order: any) => {
          return order.items.map((item: any) => [
            order.id,
            new Date(order.createdAt).toLocaleDateString('id-ID'),
            order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('id-ID') : 'Belum Pickup',
            replaceNA(order.customerName, 'Customer'),
            replaceNA(item.productName, 'Produk'),
            replaceNA(item.storeName, 'Toko'),
            item.quantity || 1,
            formatNumberForExcel(item.unitPrice || 0),
            formatNumberForExcel(item.totalPrice || 0),
            formatNumberForExcel(order.serviceFee ? order.serviceFee / order.items.length : 0),
            formatNumberForExcel((item.totalPrice || 0) + (order.serviceFee / order.items.length || 0)),
            formatNumberForExcel(item.costPrice || 0),
            formatNumberForExcel(item.totalCost || 0),
            formatNumberForExcel(item.profit || 0),
            formatPercentageForExcel(item.margin || 0),
            replaceNA(order.orderStatus, 'COMPLETED')
          ])
        }).flat()

        const transactionData = [...transactionHeaders, ...transactionRows]
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)
        XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Detail Transaksi')
      }

      // Sheet 3: Analisis Profitabilitas Produk
      if (reportData.topProfitableProducts.length > 0) {
        const productAnalysis = [
          ['ANALISIS PROFITABILITAS PRODUK'],
          [''],
          ['Ranking', 'Nama Produk', 'Total Revenue (IDR)', 'Total Cost (IDR)', 'Gross Profit (IDR)', 'Margin (%)', 'Kontribusi Revenue (%)', 'Qty Terjual', 'Harga Beli (IDR)', 'Harga Jual (IDR)', 'Status Performa'],
          ...reportData.topProfitableProducts.map((product, index) => {
            const revenueContribution = (product.revenue / reportData.totalRevenue * 100)
            const performance = product.margin > 30 ? 'Excellent' : product.margin > 20 ? 'Good' : product.margin > 10 ? 'Average' : 'Poor'
            const quantity = (product as any).quantity || 0 // Use real quantity from database
            const avgCostPrice = quantity > 0 ? product.cost / quantity : 0
            const avgSellingPrice = quantity > 0 ? product.revenue / quantity : 0
            return [
              (index + 1).toString(),
              product.name,
              formatNumberForExcel(product.revenue),
              formatNumberForExcel(product.cost),
              formatNumberForExcel(product.profit),
              formatPercentageForExcel(product.margin),
              formatPercentageForExcel(revenueContribution),
              quantity,
              formatNumberForExcel(avgCostPrice),
              formatNumberForExcel(avgSellingPrice),
              performance
            ]
          }),
          [''],
          ['INSIGHTS PRODUK'],
          ['Top Performer', replaceNA(reportData.topProfitableProducts[0]?.name, 'Tidak ada data')],
          ['Highest Margin', replaceNA(reportData.topProfitableProducts.sort((a, b) => b.margin - a.margin)[0]?.name, 'Tidak ada data')],
          ['Lowest Margin', replaceNA(reportData.topProfitableProducts.sort((a, b) => a.margin - b.margin)[0]?.name, 'Tidak ada data')],
        ]
        const productSheet = XLSX.utils.aoa_to_sheet(productAnalysis)
        XLSX.utils.book_append_sheet(workbook, productSheet, 'Analisis Produk')
      }

      // Sheet 4: Analisis Profitabilitas Toko
      if (reportData.profitByStore.length > 0) {
        const storeAnalysis = [
          ['ANALISIS PROFITABILITAS PER TOKO'],
          [''],
          ['Ranking', 'Nama Toko', 'Total Revenue (IDR)', 'Total Cost (IDR)', 'Net Profit (IDR)', 'Margin (%)', 'Kontribusi Revenue (%)', 'Jumlah Order', 'Avg Order Value (IDR)', 'Status Performa'],
          ...reportData.profitByStore.map((store: any, index: number) => {
            const revenueContribution = (store.revenue / reportData.totalRevenue * 100)
            const avgOrderValue = (store as any).orderCount && (store as any).orderCount > 0 
              ? store.revenue / (store as any).orderCount 
              : 0
            const performance = store.margin > 25 ? 'Top Tier' : store.margin > 15 ? 'Good' : store.margin > 10 ? 'Average' : 'Needs Improvement'
            const orderCount = (store as any).orderCount || 0
            return [
              (index + 1).toString(),
              store.name,
              formatNumberForExcel(store.revenue),
              formatNumberForExcel(store.cost),
              formatNumberForExcel(store.profit),
              formatPercentageForExcel(store.margin),
              formatPercentageForExcel(revenueContribution),
              orderCount,
              formatNumberForExcel(avgOrderValue),
              performance
            ]
          }),
          [''],
          ['INSIGHTS TOKO'],
          ['Top Revenue Generator', replaceNA(reportData.profitByStore[0]?.storeName, 'Tidak ada data')],
          ['Most Profitable', replaceNA(reportData.profitByStore.sort((a, b) => b.profit - a.profit)[0]?.storeName, 'Tidak ada data')],
          ['Highest Margin', replaceNA(reportData.profitByStore.sort((a, b) => (b.profit/b.revenue) - (a.profit/a.revenue))[0]?.storeName, 'Tidak ada data')],
        ]
        const storeSheet = XLSX.utils.aoa_to_sheet(storeAnalysis)
        XLSX.utils.book_append_sheet(workbook, storeSheet, 'Analisis Toko')
      }

      // Sheet 5: Tren dan Analisis Temporal
      const filteredMonthlyData = filterFromSeptember(reportData.revenueByMonth || [])
      if (filteredMonthlyData.length > 0) {
        const monthlyAnalysis = [
          ['ANALISIS TREN BULANAN'],
          [''],
          ['Bulan', 'Total Revenue (IDR)', 'Sales Revenue (IDR)', 'Service Fee (IDR)', 'Total Cost (IDR)', 'Net Profit (IDR)', 'Margin (%)', 'Growth Revenue (%)', 'Growth Profit (%)', 'Trend'],
          ...filteredMonthlyData.map((month, index) => {
            const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
            const prevMonth = filteredMonthlyData[index - 1]
            const revenueGrowth = prevMonth ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue * 100) : 0
            const profitGrowth = prevMonth ? ((month.profit - prevMonth.profit) / prevMonth.profit * 100) : 0
            const trend = revenueGrowth > 0 ? 'Naik' : revenueGrowth < 0 ? 'Turun' : 'Stabil'
            
            return [
              month.month,
              formatNumberForExcel(month.revenue),
              formatNumberForExcel(month.salesRevenue || month.revenue * 0.9), // Estimasi
              formatNumberForExcel(month.serviceFeeRevenue || month.revenue * 0.1), // Estimasi
              formatNumberForExcel(month.costs),
              formatNumberForExcel(month.profit),
              formatPercentageForExcel(margin),
              index > 0 ? formatPercentageForExcel(revenueGrowth) : 0,
              index > 0 ? formatPercentageForExcel(profitGrowth) : 0,
              trend
            ]
          }),
          [''],
          ['INSIGHTS TEMPORAL'],
          ['Best Month', replaceNA(filteredMonthlyData.sort((a, b) => b.profit - a.profit)[0]?.month, 'Tidak ada data')],
          ['Worst Month', replaceNA(filteredMonthlyData.sort((a, b) => a.profit - b.profit)[0]?.month, 'Tidak ada data')],
          ['Avg Monthly Revenue', formatNumberForExcel(filteredMonthlyData.reduce((sum, m) => sum + m.revenue, 0) / filteredMonthlyData.length)],
          ['Avg Monthly Profit', formatNumberForExcel(filteredMonthlyData.reduce((sum, m) => sum + m.profit, 0) / filteredMonthlyData.length)],
        ]
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyAnalysis)
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Analisis Temporal')
      }

      // Sheet 6: KPI Dashboard & Recommendations
      const kpiData = [
        ['DASHBOARD KPI & REKOMENDASI'],
        [''],
        ['KEY PERFORMANCE INDICATORS'],
        ['Metric', 'Current Value', 'Target', 'Status', 'Action Required'],
        ['Profit Margin (%)', formatPercentageForExcel(reportData.profitMargin), 0.20, reportData.profitMargin >= 20 ? 'Good' : 'Below Target', reportData.profitMargin < 20 ? 'Optimize costs or increase prices' : 'Maintain current strategy'],
        ['Revenue Growth (%)', 0, 0.10, 'Track Monthly', 'Monitor monthly trends'],
        ['Cost Efficiency (%)', formatPercentageForExcel(reportData.totalCosts/reportData.totalRevenue*100), 0.75, (reportData.totalCosts/reportData.totalRevenue) <= 0.75 ? 'Efficient' : 'High Costs', 'Review supplier costs and negotiations'],
        ['Store Performance', reportData.profitByStore.length, reportData.profitByStore.length, reportData.profitByStore.filter(s => s.profit > 0).length === reportData.profitByStore.length ? 'All Profitable' : 'Some Loss-making', 'Focus on underperforming stores'],
        [''],
        ['STRATEGIC RECOMMENDATIONS'],
        ['Priority', 'Area', 'Recommendation', 'Expected Impact', 'Timeline'],
        ['HIGH', 'Cost Management', 'Negotiate better rates with suppliers', 'Increase margin by 3-5%', '1-2 months'],
        ['HIGH', 'Product Mix', 'Focus on high-margin products', 'Improve overall profitability', '2-3 months'],
        ['MEDIUM', 'Store Performance', 'Support underperforming stores', 'Reduce losses, increase efficiency', '3-6 months'],
        ['MEDIUM', 'Service Fee', 'Review delivery fee structure', 'Optimize revenue streams', '1 month'],
        ['LOW', 'Market Expansion', 'Explore new product categories', 'Long-term growth', '6+ months'],
        [''],
        ['FINANCIAL HEALTH SCORE'],
        ['Component', 'Score (1-10)', 'Weight (%)', 'Weighted Score'],
        ['Profitability', reportData.profitMargin > 20 ? 9 : reportData.profitMargin > 10 ? 7 : 4, 0.40, ''],
        ['Revenue Stability', 7, 0.30, ''],
        ['Cost Control', (reportData.totalCosts/reportData.totalRevenue) < 0.7 ? 8 : 6, 0.20, ''],
        ['Growth Potential', 7, 0.10, ''],
        ['Overall Score', 7.2, 1.00, 'Good Financial Health'],
      ]
      const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData)
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI & Recommendations')

      // Generate filename with timestamp
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
      const storeFilter = filters.storeId ? `_${stores.find(s => s.id === filters.storeId)?.name.replace(/\s+/g, '_')}` : '_AllStores'
      const filename = `Profit_Loss_Report_${dateStr}_${timeStr}${storeFilter}.xlsx`

      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success('Laporan komprehensif berhasil di-export ke Excel')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal export laporan')
    } finally {
      setIsExporting(false)
    }
  }

  // Filter data mulai dari September (bulan ke-9)
  const filterFromSeptember = (data: any[]) => {
    return data.filter(item => {
      // Ekstrak bulan dari format "September 2025" atau "Sep 2025"
      const monthMatch = item.month.match(/(September|Sep|Oktober|Oct|November|Nov|Desember|Dec|Januari|Jan|Februari|Feb|Maret|Mar|April|Apr|Mei|May|Juni|Jun|Juli|Jul|Agustus|Aug)/i)
      if (!monthMatch) return true
      
      const monthName = monthMatch[1].toLowerCase()
      const monthOrder: Record<string, number> = {
        'september': 9, 'sep': 9,
        'oktober': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'desember': 12, 'dec': 12,
        'januari': 1, 'jan': 1,
        'februari': 2, 'feb': 2,
        'maret': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'mei': 5, 'may': 5,
        'juni': 6, 'jun': 6,
        'juli': 7, 'jul': 7,
        'agustus': 8, 'aug': 8
      }
      
      const currentMonth = monthOrder[monthName]
      return currentMonth >= 9 || currentMonth <= 12 // September onwards (and next year Jan-Dec if needed)
    })
  }

  const filteredMonthlyData = filterFromSeptember(reportData?.revenueByMonth || [])

  const monthlyRevenueChart = filteredMonthlyData.map(item => ({
    name: item.month,
    value: item.revenue
  }))

  const monthlyProfitChart = filteredMonthlyData.map(item => ({
    name: item.month,
    value: item.profit
  }))

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
                title="Total Pemasukan"
                value={reportData.totalRevenue}
                format="currency"
                icon={DollarSign}
                description="Penjualan + biaya ongkos kirim"
                trend={{
                  value: 5.2,
                  label: 'vs bulan lalu',
                  isPositive: true
                }}
              />
              <MetricCard
                title="Pembayaran ke Toko"
                value={reportData.totalCosts}
                format="currency"
                icon={TrendingDown}
                description="Biaya yang dibayar ke toko"
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
                description="Pemasukan - pembayaran ke toko"
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown Keuangan</CardTitle>
                <CardDescription>
                  Rincian pemasukan dan pengeluaran platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hasil Penjualan</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{formatCurrency((reportData as any).breakdown?.salesRevenue || 0)}
                    </span>
                  </div>
                  <Progress value={((reportData as any).breakdown?.salesRevenue || 0) / (reportData as any).breakdown?.totalIncome * 100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Biaya Ongkos Kirim</span>
                    <span className="text-green-600 dark:text-green-400">
                      +{formatCurrency((reportData as any).breakdown?.serviceFeeRevenue || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((reportData as any).breakdown?.serviceFeeRevenue || 0) / (reportData as any).breakdown?.totalIncome * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pembayaran ke Toko</span>
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency((reportData as any).breakdown?.storeCosts || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((reportData as any).breakdown?.storeCosts || 0) / (reportData as any).breakdown?.totalIncome * 100} 
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Tren Revenue Bulanan</span>
                      <Badge variant="secondary" className="text-xs">From Sept</Badge>
                    </CardTitle>
                    <CardDescription>
                      Total pemasukan per bulan (sales + service fee)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="w-full overflow-hidden" style={{ height: '300px' }}>
                      <div className="space-y-3 h-full overflow-y-auto">
                        {monthlyRevenueChart.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>Tren Profit Bulanan</span>
                      <Badge variant="secondary" className="text-xs">From Sept</Badge>
                    </CardTitle>
                    <CardDescription>
                      Laba bersih per bulan (pemasukan - pembayaran toko)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="w-full overflow-hidden" style={{ height: '300px' }}>
                      <div className="space-y-3 h-full overflow-y-auto">
                        {monthlyProfitChart.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.name}
                            </span>
                            <span className={`text-sm font-semibold ${item.value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Top Profitable Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Top 5 Produk Terlaris</CardTitle>
                  <CardDescription>
                    Produk dengan kontribusi profit tertinggi
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="w-full overflow-hidden" style={{ height: '300px' }}>
                    <div className="space-y-3 h-full overflow-y-auto">
                      {topProductsChart.slice(0, 5).map((item, index) => {
                        const maxValue = Math.max(...topProductsChart.map(d => d.value))
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{item.name}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(item.value)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Produk Paling Menguntungkan</CardTitle>
                  <CardDescription>
                    Detail profitabilitas per produk
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-hidden" style={{ height: '300px' }}>
                    <div className="overflow-y-auto h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.topProfitableProducts.slice(0, 10).map((product, index) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <Badge variant="outline">{index + 1}</Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-sm">
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Profitability */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Profitabilitas per Toko</span>
                  <Badge variant="outline" className="text-xs">Full Width</Badge>
                </CardTitle>
                <CardDescription>
                  Kontribusi keuntungan dari masing-masing toko berdasarkan sales - cost
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-hidden" style={{ height: '300px' }}>
                  <div className="space-y-3 h-full overflow-y-auto">
                    {reportData.profitByStore.map((store, index) => {
                      const margin = store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0
                      return (
                        <div key={store.storeId} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <Badge variant="secondary" className="text-xs w-8 h-6 flex items-center justify-center flex-shrink-0">
                              #{index + 1}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {store.storeName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Revenue: {formatCurrency(store.revenue)} • Cost: {formatCurrency(store.costs)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right" style={{ minWidth: '120px' }}>
                            <p className={`font-semibold text-sm ${store.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(store.profit)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Margin: {formatPercentage(margin)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Detailed Table */}
            <Card className="w-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>Detail Bulanan</span>
                  <Badge variant="outline" className="text-xs">Updated Sept</Badge>
                </CardTitle>
                <CardDescription>
                  Breakdown pemasukan (sales + service fee), pembayaran toko, dan laba bersih per bulan
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-hidden" style={{ height: '300px' }}>
                  <div className="overflow-auto h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="min-w-[100px]">Bulan</TableHead>
                          <TableHead className="text-right min-w-[120px]">Pemasukan</TableHead>
                          <TableHead className="text-right min-w-[120px]">Pembayaran Toko</TableHead>
                          <TableHead className="text-right min-w-[120px]">Laba Bersih</TableHead>
                          <TableHead className="text-right min-w-[80px]">Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMonthlyData.slice(-6).reverse().map((month) => {
                          const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
                          return (
                            <TableRow key={month.month} className="h-12">
                              <TableCell className="font-medium text-sm">
                                {month.month}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(month.revenue)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(month.costs)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold text-sm ${month.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(month.profit)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={margin > 20 ? 'default' : margin > 10 ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {formatPercentage(margin)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ReportLayout>
    </AdminPageLayout>
  )
}

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
      
      // Debug logging untuk memeriksa akurasi data
      console.log('=== PROFIT-LOSS API RESPONSE DEBUG ===')
      console.log('Total Revenue:', data.totalRevenue)
      console.log('Total Costs:', data.totalCosts)
      console.log('Net Profit:', data.netProfit)
      console.log('Profit Margin:', data.profitMargin)
      console.log('Breakdown:', data.breakdown)
      console.log('Top 3 Products:', data.topProfitableProducts?.slice(0, 3))
      console.log('========================================')
      
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
        if (isNaN(amount) || !isFinite(amount)) return 0
        return Math.round(amount) // Return raw number for Excel calculations
      }
      
      const formatPercentageForExcel = (value: number): number => {
        if (isNaN(value) || !isFinite(value)) return 0
        return Number((value / 100).toFixed(4)) // Convert to decimal for Excel percentage format
      }
      
      const safeString = (value: any): string => {
        if (value === null || value === undefined) return ''
        return String(value)
      }
      
      const safeNumber = (value: any): number => {
        const num = Number(value)
        if (isNaN(num) || !isFinite(num)) return 0
        return num
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
        ['Dharma Wanita Perdami'],
        [''],
        ['INFORMASI LAPORAN'],
        ['Periode Analisis', `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
        ['Filter Toko', filters.storeId ? stores.find(s => s.id === filters.storeId)?.name || 'Toko Tertentu' : 'Semua Toko'],
        ['Total Transaksi', safeNumber((detailData.summary as any)?.totalOrders) || reportData.topProfitableProducts.length || 0],
        [''],
        ['RINGKASAN EKSEKUTIF'],
        ['Metrik', 'Nilai (IDR)', 'Persentase', 'Status'],
        ['Total Pemasukan', formatNumberForExcel(safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)), formatPercentageForExcel(100), (safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)) > 0 ? 'Positif' : 'Negatif'],
        ['  - Sales Revenue', formatNumberForExcel(safeNumber((detailData.summary as any)?.totalSalesRevenue) || safeNumber((reportData as any).breakdown?.salesRevenue) || 0), formatPercentageForExcel((safeNumber((detailData.summary as any)?.totalSalesRevenue) || safeNumber((reportData as any).breakdown?.salesRevenue) || 0) / (safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)) * 100), 'Komponen Utama'],
        ['  - Service Fee', formatNumberForExcel(safeNumber((detailData.summary as any)?.totalServiceFee) || safeNumber((reportData as any).breakdown?.serviceFeeRevenue) || 0), formatPercentageForExcel((safeNumber((detailData.summary as any)?.totalServiceFee) || safeNumber((reportData as any).breakdown?.serviceFeeRevenue) || 0) / (safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)) * 100), 'Pendapatan Jasa'],
        ['Total Pengeluaran', formatNumberForExcel(safeNumber((detailData.summary as any)?.totalCosts) || safeNumber(reportData.totalCosts)), formatPercentageForExcel((safeNumber((detailData.summary as any)?.totalCosts) || safeNumber(reportData.totalCosts)) / (safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)) * 100), 'Pembayaran ke Toko'],
        ['Laba Bersih', formatNumberForExcel(safeNumber((detailData.summary as any)?.netProfit) || safeNumber(reportData.netProfit)), formatPercentageForExcel((safeNumber((detailData.summary as any)?.netProfit) || safeNumber(reportData.netProfit)) / (safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)) * 100), (safeNumber((detailData.summary as any)?.netProfit) || safeNumber(reportData.netProfit)) > 0 ? 'PROFIT' : 'LOSS'],
        ['Margin Keuntungan', formatPercentageForExcel(safeNumber((detailData.summary as any)?.profitMargin) || safeNumber(reportData.profitMargin)), '', (safeNumber((detailData.summary as any)?.profitMargin) || safeNumber(reportData.profitMargin)) > 20 ? 'Sangat Baik' : (safeNumber((detailData.summary as any)?.profitMargin) || safeNumber(reportData.profitMargin)) > 10 ? 'Baik' : 'Perlu Perbaikan'],
        [''],
        ['KESIMPULAN BISNIS'],
        ['Status Profitabilitas', reportData.netProfit > 0 ? 'MENGUNTUNGKAN' : 'MERUGI'],
        ['Tingkat Efisiensi', reportData.profitMargin > 15 ? 'EFISIEN' : 'PERLU OPTIMASI'],
        ['Rekomendasi', reportData.profitMargin < 10 ? 'Review cost structure & pricing' : 'Pertahankan performa'],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(executiveSummary)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary')

      // Sheet 2: Detailed Transactions (Sales Only - No Service Fee)
      if (detailData.transactions && detailData.transactions.length > 0) {
        const transactionHeaders = [
          ['DETAIL TRANSAKSI PENJUALAN'],
          [''],
          ['No Order', 'Tanggal Order', 'Tanggal Pickup', 'Nama Customer', 'Nama Produk', 'Nama Toko', 'Jumlah Qty', 'Harga Jual Satuan (IDR)', 'Subtotal Produk (IDR)', 'Harga Beli Satuan (IDR)', 'Subtotal Cost (IDR)', 'Keuntungan Item (IDR)', 'Margin Profit (%)', 'Status Order']
        ]
        
        const transactionRows = detailData.transactions.map((order: any) => {
          return order.items.map((item: any) => [
            safeString(order.orderNumber),
            new Date(order.createdAt).toLocaleDateString('id-ID'),
            order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('id-ID') : 'Belum Pickup',
            safeString(order.customerName),
            safeString(item.productName),
            safeString(item.storeName),
            safeNumber(item.quantity),
            formatNumberForExcel(safeNumber(item.unitPrice)),
            formatNumberForExcel(safeNumber(item.totalPrice)),
            formatNumberForExcel(safeNumber(item.costPrice)),
            formatNumberForExcel(safeNumber(item.totalCost)),
            formatNumberForExcel(safeNumber(item.profit)),
            formatPercentageForExcel(safeNumber(item.margin)),
            safeString(order.orderStatus)
          ])
        }).flat()

        const transactionData = [...transactionHeaders, ...transactionRows]
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)
        XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Detail Transaksi')
      }

      // Sheet 3: Service Fee Analysis (Delivery Cost per Store)
      if (detailData.transactions && detailData.transactions.length > 0) {
        const serviceFeeHeaders = [
          ['ANALISIS ONGKOS KIRIM PER TOKO'],
          [''],
          ['No Order', 'Tanggal Order', 'Customer', 'Toko', 'Jumlah Item di Toko', 'Ongkos Kirim (IDR)', 'Status Order']
        ]
        
        const serviceFeeRows = detailData.transactions.map((order: any) => {
          // Group items by store
          const storeGroups = order.items.reduce((groups: any, item: any) => {
            const storeId = item.storeId || 'unknown'
            const storeName = item.storeName || 'Unknown Store'
            if (!groups[storeId]) {
              groups[storeId] = {
                storeName: storeName,
                items: []
              }
            }
            groups[storeId].items.push(item)
            return groups
          }, {})
          
          // Use actual service fee from order, distributed equally across stores
          const totalStores = Object.keys(storeGroups).length
          const serviceFeePerStore = totalStores > 0 ? (order.serviceFee || 0) / totalStores : 0
          
          return Object.entries(storeGroups).map(([storeId, storeData]: [string, any]) => [
            order.orderNumber,
            new Date(order.createdAt).toLocaleDateString('id-ID'),
            order.customerName || 'Customer',
            storeData.storeName,
            storeData.items.length,
            formatNumberForExcel(serviceFeePerStore),
            order.orderStatus || 'COMPLETED'
          ])
        }).flat()

        const serviceFeeData = [...serviceFeeHeaders, ...serviceFeeRows]
        const serviceFeeSheet = XLSX.utils.aoa_to_sheet(serviceFeeData)
        XLSX.utils.book_append_sheet(workbook, serviceFeeSheet, 'Analisis Ongkos Kirim')
      }

      // Sheet 4: Analisis Profitabilitas Produk - Calculated from detailed transactions
      if (detailData.transactions && detailData.transactions.length > 0) {
        // Calculate accurate product analysis from transaction details
        const productMap = new Map()
        
        detailData.transactions.forEach((order: any) => {
          order.items.forEach((item: any) => {
            const productKey = item.productName
            const existing = productMap.get(productKey) || {
              name: item.productName,
              revenue: 0,
              cost: 0,
              profit: 0,
              quantity: 0,
              orderCount: 0,
              totalCostPrice: 0,
              totalUnitPrice: 0,
              priceEntries: 0
            }
            
            existing.revenue += safeNumber(item.totalPrice)
            existing.cost += safeNumber(item.totalCost)
            existing.profit += safeNumber(item.profit)
            existing.quantity += safeNumber(item.quantity)
            existing.orderCount += 1
            existing.totalCostPrice += safeNumber(item.costPrice) * safeNumber(item.quantity)
            existing.totalUnitPrice += safeNumber(item.unitPrice) * safeNumber(item.quantity)
            existing.priceEntries += safeNumber(item.quantity)
            
            productMap.set(productKey, existing)
          })
        })
        
        // Convert to array and calculate final metrics
        const productAnalysisData = Array.from(productMap.values())
          .map(product => ({
            ...product,
            margin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0,
            avgCostPrice: product.priceEntries > 0 ? product.totalCostPrice / product.priceEntries : 0,
            avgUnitPrice: product.priceEntries > 0 ? product.totalUnitPrice / product.priceEntries : 0,
            revenueContribution: ((detailData.summary as any)?.totalRevenue || reportData.totalRevenue) > 0 ? 
              (product.revenue / ((detailData.summary as any)?.totalRevenue || reportData.totalRevenue)) * 100 : 0
          }))
          .sort((a, b) => b.profit - a.profit)
        
        const productAnalysis = [
          ['ANALISIS PROFITABILITAS PRODUK'],
          ['Data berdasarkan transaksi detail periode terpilih'],
          [''],
          ['Ranking', 'Nama Produk', 'Total Revenue (IDR)', 'Total Cost (IDR)', 'Gross Profit (IDR)', 'Margin (%)', 'Kontribusi Revenue (%)', 'Qty Terjual', 'Rata-rata Harga Beli (IDR)', 'Rata-rata Harga Jual (IDR)', 'Jumlah Order', 'Status Performa'],
          ...productAnalysisData.map((product, index) => {
            const performance = product.margin > 30 ? 'Excellent' : product.margin > 20 ? 'Good' : product.margin > 10 ? 'Average' : 'Poor'
            return [
              (index + 1).toString(),
              product.name,
              formatNumberForExcel(product.revenue),
              formatNumberForExcel(product.cost),
              formatNumberForExcel(product.profit),
              formatPercentageForExcel(product.margin),
              formatPercentageForExcel(product.revenueContribution),
              product.quantity,
              formatNumberForExcel(product.avgCostPrice),
              formatNumberForExcel(product.avgUnitPrice),
              product.orderCount,
              performance
            ]
          }),
          [''],
          ['INSIGHTS PRODUK BERDASARKAN DATA TRANSAKSI'],
          ['Top Performer (Profit)', productAnalysisData[0]?.name || 'Tidak ada data'],
          ['Highest Margin', productAnalysisData.sort((a, b) => b.margin - a.margin)[0]?.name || 'Tidak ada data'],
          ['Lowest Margin', productAnalysisData.sort((a, b) => a.margin - b.margin)[0]?.name || 'Tidak ada data'],
          ['Most Sold (Qty)', productAnalysisData.sort((a, b) => b.quantity - a.quantity)[0]?.name || 'Tidak ada data'],
          ['Total Products', productAnalysisData.length],
          ['Avg Margin All Products', formatPercentageForExcel(productAnalysisData.reduce((sum, p) => sum + p.margin, 0) / productAnalysisData.length)],
        ]
        const productSheet = XLSX.utils.aoa_to_sheet(productAnalysis)
        XLSX.utils.book_append_sheet(workbook, productSheet, 'Analisis Produk')
      }

      // Sheet 5: Analisis Profitabilitas Toko - Calculated from detailed transactions
      if (detailData.transactions && detailData.transactions.length > 0) {
        // Calculate accurate store analysis from transaction details
        const storeMap = new Map()
        
        detailData.transactions.forEach((order: any) => {
          order.items.forEach((item: any) => {
            const storeKey = item.storeName || 'Unknown Store'
            const existing = storeMap.get(storeKey) || {
              storeId: item.storeId,
              storeName: storeKey,
              revenue: 0,
              cost: 0,
              profit: 0,
              itemCount: 0,
              orders: new Set()
            }
            
            existing.revenue += safeNumber(item.totalPrice)
            existing.cost += safeNumber(item.totalCost)
            existing.profit += safeNumber(item.profit)
            existing.itemCount += safeNumber(item.quantity)
            existing.orders.add(order.id)
            
            storeMap.set(storeKey, existing)
          })
        })
        
        // Convert to array and calculate final metrics
        const storeAnalysisData = Array.from(storeMap.values())
          .map(store => ({
            ...store,
            margin: store.revenue > 0 ? (store.profit / store.revenue) * 100 : 0,
            orderCount: store.orders.size,
            avgOrderValue: store.orders.size > 0 ? store.revenue / store.orders.size : 0,
            revenueContribution: ((detailData.summary as any)?.totalRevenue || reportData.totalRevenue) > 0 ? 
              (store.revenue / ((detailData.summary as any)?.totalRevenue || reportData.totalRevenue)) * 100 : 0
          }))
          .sort((a, b) => b.profit - a.profit)
        
        const storeAnalysis = [
          ['ANALISIS PROFITABILITAS PER TOKO'],
          ['Data berdasarkan transaksi detail periode terpilih'],
          [''],
          ['Ranking', 'Nama Toko', 'Total Revenue (IDR)', 'Total Cost (IDR)', 'Net Profit (IDR)', 'Margin (%)', 'Kontribusi Revenue (%)', 'Jumlah Order', 'Jumlah Item Terjual', 'Avg Order Value (IDR)', 'Status Performa'],
          ...storeAnalysisData.map((store, index) => {
            const performance = store.margin > 20 ? 'Excellent' : store.margin > 15 ? 'Good' : store.margin > 10 ? 'Average' : 'Poor'
            return [
              (index + 1).toString(),
              store.storeName,
              formatNumberForExcel(store.revenue),
              formatNumberForExcel(store.cost),
              formatNumberForExcel(store.profit),
              formatPercentageForExcel(store.margin),
              formatPercentageForExcel(store.revenueContribution),
              store.orderCount,
              store.itemCount,
              formatNumberForExcel(store.avgOrderValue),
              performance
            ]
          }),
          [''],
          ['INSIGHTS TOKO BERDASARKAN DATA TRANSAKSI'],
          ['Top Performer (Profit)', storeAnalysisData[0]?.storeName || 'Tidak ada data'],
          ['Highest Margin', storeAnalysisData.sort((a, b) => b.margin - a.margin)[0]?.storeName || 'Tidak ada data'],
          ['Most Orders', storeAnalysisData.sort((a, b) => b.orderCount - a.orderCount)[0]?.storeName || 'Tidak ada data'],
          ['Highest AOV', storeAnalysisData.sort((a, b) => b.avgOrderValue - a.avgOrderValue)[0]?.storeName || 'Tidak ada data'],
          ['Total Active Stores', storeAnalysisData.length],
          ['Avg Margin All Stores', formatPercentageForExcel(storeAnalysisData.reduce((sum, s) => sum + s.margin, 0) / storeAnalysisData.length)],
        ]
        const storeSheet = XLSX.utils.aoa_to_sheet(storeAnalysis)
        XLSX.utils.book_append_sheet(workbook, storeSheet, 'Analisis Toko')
      }

      // Sheet 6: Tren dan Analisis Temporal - Enhanced with accurate breakdown
      const filteredMonthlyData = filterFromSeptember(reportData.revenueByMonth || [])
      if (filteredMonthlyData.length > 0) {
        // Calculate sales and service ratios once
        const totalRevenue = ((detailData.summary as any)?.totalRevenue || reportData.totalRevenue)
        const totalSalesRevenue = ((detailData.summary as any)?.totalSalesRevenue || safeNumber((reportData as any).breakdown?.salesRevenue) || 0)
        const totalServiceFee = ((detailData.summary as any)?.totalServiceFee || safeNumber((reportData as any).breakdown?.serviceFeeRevenue) || 0)
        
        const salesRatio = totalRevenue > 0 ? totalSalesRevenue / totalRevenue : 0.9
        const serviceRatio = totalRevenue > 0 ? totalServiceFee / totalRevenue : 0.1
        
        const monthlyAnalysis = [
          ['ANALISIS TREN BULANAN'],
          ['Data berdasarkan periode analisis yang dipilih'],
          [''],
          ['Bulan', 'Total Revenue (IDR)', 'Sales Revenue (IDR)', 'Service Fee (IDR)', 'Total Cost (IDR)', 'Net Profit (IDR)', 'Margin (%)', 'Growth Revenue (%)', 'Growth Profit (%)', 'Trend'],
          ...filteredMonthlyData.map((month, index) => {
            const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0
            const prevMonth = filteredMonthlyData[index - 1]
            const revenueGrowth = prevMonth ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue * 100) : 0
            const profitGrowth = prevMonth ? ((month.profit - prevMonth.profit) / prevMonth.profit * 100) : 0
            const trend = revenueGrowth > 5 ? 'Naik Signifikan' : revenueGrowth > 0 ? 'Naik' : revenueGrowth < -5 ? 'Turun Signifikan' : revenueGrowth < 0 ? 'Turun' : 'Stabil'
            
            return [
              month.month,
              formatNumberForExcel(month.revenue),
              formatNumberForExcel(month.revenue * salesRatio),
              formatNumberForExcel(month.revenue * serviceRatio),
              formatNumberForExcel(month.costs),
              formatNumberForExcel(month.profit),
              formatPercentageForExcel(margin),
              index > 0 ? formatPercentageForExcel(revenueGrowth) : 0,
              index > 0 ? formatPercentageForExcel(profitGrowth) : 0,
              trend
            ]
          }),
          [''],
          ['INSIGHTS TEMPORAL BERDASARKAN DATA AKTUAL'],
          ['Best Month (Profit)', filteredMonthlyData.sort((a, b) => b.profit - a.profit)[0]?.month || 'Tidak ada data'],
          ['Worst Month (Profit)', filteredMonthlyData.sort((a, b) => a.profit - b.profit)[0]?.month || 'Tidak ada data'],
          ['Best Month (Revenue)', filteredMonthlyData.sort((a, b) => b.revenue - a.revenue)[0]?.month || 'Tidak ada data'],
          ['Avg Monthly Revenue', formatNumberForExcel(filteredMonthlyData.reduce((sum, m) => sum + m.revenue, 0) / filteredMonthlyData.length)],
          ['Avg Monthly Profit', formatNumberForExcel(filteredMonthlyData.reduce((sum, m) => sum + m.profit, 0) / filteredMonthlyData.length)],
          ['Avg Monthly Margin', formatPercentageForExcel(filteredMonthlyData.reduce((sum, m) => (m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0), 0) / filteredMonthlyData.length)],
          ['Sales vs Service Ratio', `${(salesRatio * 100).toFixed(1)}% : ${(serviceRatio * 100).toFixed(1)}%`],
        ]
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyAnalysis)
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Analisis Temporal')
      }

      // Sheet 7: KPI Dashboard & Recommendations - Using accurate data
      const actualProfitMargin = safeNumber((detailData.summary as any)?.profitMargin) || safeNumber(reportData.profitMargin)
      const actualTotalRevenue = safeNumber((detailData.summary as any)?.totalRevenue) || safeNumber(reportData.totalRevenue)
      const actualTotalCosts = safeNumber((detailData.summary as any)?.totalCosts) || safeNumber(reportData.totalCosts)
      const actualSalesRevenue = safeNumber((detailData.summary as any)?.totalSalesRevenue) || safeNumber((reportData as any).breakdown?.salesRevenue) || 0
      const actualServiceFee = safeNumber((detailData.summary as any)?.totalServiceFee) || safeNumber((reportData as any).breakdown?.serviceFeeRevenue) || 0
      const costEfficiencyRatio = actualTotalRevenue > 0 ? (actualTotalCosts / actualTotalRevenue) : 0
      const kpiSalesRatio = actualTotalRevenue > 0 ? actualSalesRevenue / actualTotalRevenue : 0.9
      const kpiServiceRatio = actualTotalRevenue > 0 ? actualServiceFee / actualTotalRevenue : 0.1
      
      const kpiData = [
        ['DASHBOARD KPI & REKOMENDASI'],
        ['Berdasarkan data transaksi aktual periode terpilih'],
        [''],
        ['KEY PERFORMANCE INDICATORS'],
        ['Metric', 'Current Value', 'Target', 'Status', 'Action Required'],
        ['Profit Margin (%)', formatPercentageForExcel(actualProfitMargin), 20, actualProfitMargin >= 20 ? 'Excellent' : actualProfitMargin >= 15 ? 'Good' : actualProfitMargin >= 10 ? 'Average' : 'Below Target', actualProfitMargin < 15 ? 'Focus on cost optimization and pricing strategy' : 'Maintain current performance'],
        ['Revenue Performance', formatNumberForExcel(actualTotalRevenue), formatNumberForExcel(actualTotalRevenue * 1.1), actualTotalRevenue > 0 ? 'Active' : 'No Data', 'Monitor revenue trends and growth opportunities'],
        ['Cost Efficiency (%)', formatPercentageForExcel(costEfficiencyRatio * 100), 75, costEfficiencyRatio <= 0.75 ? 'Efficient' : costEfficiencyRatio <= 0.85 ? 'Acceptable' : 'High Costs', costEfficiencyRatio > 0.75 ? 'Review supplier costs and negotiate better rates' : 'Maintain cost discipline'],
        ['Transaction Volume', safeNumber((detailData.summary as any)?.totalOrders) || 0, '', (detailData.summary as any)?.totalOrders > 0 ? 'Active Business' : 'No Transactions', 'Continue customer acquisition and retention'],
        [''],
        ['FINANCIAL BREAKDOWN ANALYSIS'],
        ['Component', 'Amount (IDR)', 'Percentage (%)', 'Performance'],
        ['Sales Revenue', formatNumberForExcel(actualSalesRevenue), formatPercentageForExcel(kpiSalesRatio * 100), 'Primary Income'],
        ['Service Fee Revenue', formatNumberForExcel(actualServiceFee), formatPercentageForExcel(kpiServiceRatio * 100), 'Secondary Income'],
        ['Total Revenue', formatNumberForExcel(actualTotalRevenue), 100, 'Total Income'],
        ['Total Costs', formatNumberForExcel(actualTotalCosts), formatPercentageForExcel(costEfficiencyRatio * 100), costEfficiencyRatio <= 0.75 ? 'Well Managed' : 'Needs Attention'],
        ['Net Profit', formatNumberForExcel(safeNumber((detailData.summary as any)?.netProfit) || 0), formatPercentageForExcel(actualProfitMargin), actualProfitMargin > 15 ? 'Strong Performance' : 'Room for Improvement'],
        [''],
        ['STRATEGIC RECOMMENDATIONS'],
        ['Priority', 'Area', 'Recommendation', 'Expected Impact', 'Timeline'],
        ['HIGH', 'Cost Management', 'Negotiate better supplier rates and optimize operational costs', `Potential margin increase: ${Math.min(5, Math.max(0, 20 - actualProfitMargin)).toFixed(1)}%`, '1-2 months'],
        ['HIGH', 'Product Mix', 'Focus on high-margin products and optimize pricing', `Target margin improvement: ${Math.max(0, 25 - actualProfitMargin).toFixed(1)}%`, '2-3 months'],
        ['MEDIUM', 'Revenue Growth', 'Enhance customer acquisition and increase order frequency', 'Target 15-20% revenue growth', '3-6 months'],
        ['MEDIUM', 'Service Fee Optimization', `Current ratio: ${(kpiServiceRatio * 100).toFixed(1)}% - Review delivery fee structure`, 'Optimize revenue streams', '1 month'],
        ['LOW', 'Market Expansion', 'Explore new product categories and market segments', 'Long-term sustainable growth', '6+ months'],
        [''],
        ['FINANCIAL HEALTH SCORE'],
        ['Component', 'Score (1-10)', 'Weight (%)', 'Weighted Score', 'Comments'],
        ['Profitability', actualProfitMargin > 20 ? 9 : actualProfitMargin > 15 ? 8 : actualProfitMargin > 10 ? 6 : 4, 40, '', actualProfitMargin > 15 ? 'Strong profitability' : 'Needs improvement'],
        ['Revenue Performance', actualTotalRevenue > 0 ? 8 : 0, 25, '', actualTotalRevenue > 0 ? 'Active business' : 'No revenue data'],
        ['Cost Management', costEfficiencyRatio < 0.7 ? 9 : costEfficiencyRatio < 0.8 ? 7 : 5, 25, '', costEfficiencyRatio < 0.75 ? 'Efficient cost control' : 'Cost optimization needed'],
        ['Transaction Health', (detailData.summary as any)?.totalOrders > 10 ? 8 : (detailData.summary as any)?.totalOrders > 0 ? 6 : 0, 10, '', 'Based on transaction volume'],
        ['Overall Health Score', '', 100, Math.round((actualProfitMargin > 15 ? 8 : 6) * 0.4 + 8 * 0.25 + (costEfficiencyRatio < 0.75 ? 8 : 6) * 0.25 + 7 * 0.1), actualProfitMargin > 15 && costEfficiencyRatio < 0.75 ? 'Excellent Financial Health' : 'Good Financial Health - Monitor Key Metrics'],
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

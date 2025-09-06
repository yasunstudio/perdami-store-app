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
import { Users, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { DateRange, ReportFilters as IReportFilters, PurchaseReportData } from '@/features/admin/reports/types/index'
import { getDefaultDateRange, formatCurrency, formatNumber, buildReportFilters } from '@/features/admin/reports/utils/index'

export default function PurchaseReportPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<PurchaseReportData | null>(null)
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
      const response = await fetch(`/api/admin/reports/purchases?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase report')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching purchase report:', error)
      toast.error('Gagal memuat data laporan pembelian')
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
        ['LAPORAN PEMBELIAN'],
        [''],
        ['Periode', `${filters.dateRange.from.toLocaleDateString('id-ID')} - ${filters.dateRange.to.toLocaleDateString('id-ID')}`],
        ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
        [''],
        ['RINGKASAN PEMBELIAN'],
        ['Metrik', 'Nilai'],
        ['Total Pembelian', formatCurrency(reportData.totalPurchases)],
        ['Total Transaksi', reportData.totalTransactions.toString()],
        ['Rata-rata Nilai Transaksi', formatCurrency(reportData.averageTransactionValue)],
        ['Pelanggan Aktif', reportData.topCustomers.length.toString()],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

      // Sheet 2: Top Customers
      if (reportData.topCustomers.length > 0) {
        const customersData = [
          ['PELANGGAN TERATAS'],
          [''],
          ['Ranking', 'Nama Pelanggan', 'Email', 'Total Pembelian', 'Jumlah Pesanan'],
          ...reportData.topCustomers.map((customer, index) => [
            (index + 1).toString(),
            customer.name,
            customer.email,
            formatCurrency(customer.totalSpent),
            customer.orderCount.toString()
          ])
        ]
        const customersSheet = XLSX.utils.aoa_to_sheet(customersData)
        XLSX.utils.book_append_sheet(workbook, customersSheet, 'Pelanggan Teratas')
      }

      // Sheet 3: Purchases by Category
      if (reportData.purchasesByCategory.length > 0) {
        const categoryData = [
          ['PEMBELIAN PER KATEGORI'],
          [''],
          ['Ranking', 'Kategori', 'Total Pembelian', 'Jumlah Transaksi', 'Persentase'],
          ...reportData.purchasesByCategory.map((category, index) => [
            (index + 1).toString(),
            category.categoryName,
            formatCurrency(category.purchases),
            category.transactions.toString(),
            `${((category.purchases / reportData.totalPurchases) * 100).toFixed(2)}%`
          ])
        ]
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Pembelian per Kategori')
      }

      // Sheet 4: Daily Trend
      if (reportData.purchasesByDay.length > 0) {
        const dailyData = [
          ['TREN PEMBELIAN HARIAN'],
          [''],
          ['Tanggal', 'Total Pembelian', 'Jumlah Transaksi', 'Rata-rata per Transaksi'],
          ...reportData.purchasesByDay.map((day) => [
            day.date,
            formatCurrency(day.purchases),
            day.transactions.toString(),
            formatCurrency(day.transactions > 0 ? day.purchases / day.transactions : 0)
          ])
        ]
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Tren Harian')
      }

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `Laporan_Pembelian_${dateStr}.xlsx`

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

  const chartData = reportData?.purchasesByDay.map(item => ({
    name: item.date,
    value: item.purchases,
    label: `${item.transactions} transaksi`
  })) || []

  const categoryChart = reportData?.purchasesByCategory.slice(0, 5).map(item => ({
    name: item.categoryName,
    value: item.purchases
  })) || []

  return (
    <AdminPageLayout title="Laporan Pembelian">
      <ReportLayout
        title="Laporan Pembelian"
        description="Analisis perilaku pembelian pelanggan dan tren transaksi"
        isLoading={isLoading}
        isExporting={isExporting}
        onRefresh={handleRefresh}
        onExport={handleExport}
        badges={reportData ? [
          { label: 'Total Transaksi', value: reportData.totalTransactions },
          { label: 'Pelanggan Aktif', value: reportData.topCustomers.length },
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
                title="Total Pembelian"
                value={reportData.totalPurchases}
                format="currency"
                icon={DollarSign}
                description="Total nilai semua transaksi"
              />
              <MetricCard
                title="Total Transaksi"
                value={reportData.totalTransactions}
                format="number"
                icon={CreditCard}
                description="Jumlah transaksi yang selesai"
              />
              <MetricCard
                title="Rata-rata Nilai Transaksi"
                value={reportData.averageTransactionValue}
                format="currency"
                icon={TrendingUp}
                description="ATV (Average Transaction Value)"
              />
              <MetricCard
                title="Pelanggan Aktif"
                value={reportData.topCustomers.length}
                format="number"
                icon={Users}
                description="Pelanggan yang melakukan pembelian"
              />
            </MetricsGrid>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Tren Pembelian Harian"
                description="Volume pembelian per hari"
                data={chartData}
                type="line"
                formatValue="currency"
                height={300}
              />
              <SimpleChart
                title="Pembelian per Kategori"
                description="Distribusi pembelian berdasarkan kategori"
                data={categoryChart}
                type="pie"
                formatValue="currency"
                height={300}
              />
            </div>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pelanggan Teratas</CardTitle>
                <CardDescription>
                  Pelanggan dengan total pembelian tertinggi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Pelanggan</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Jumlah Pesanan</TableHead>
                      <TableHead className="text-right">Total Pembelian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.topCustomers.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Badge variant="outline">{index + 1}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {customer.email}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(customer.orderCount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performa Kategori</CardTitle>
                <CardDescription>
                  Analisis pembelian berdasarkan kategori produk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.purchasesByCategory.map((category, index) => (
                    <div key={category.categoryId} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {category.categoryName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.transactions} transaksi
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(category.purchases)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {((category.purchases / reportData.totalPurchases) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Trend Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tren Harian</CardTitle>
                <CardDescription>
                  Data pembelian per hari dalam periode yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Jumlah Transaksi</TableHead>
                      <TableHead className="text-right">Total Pembelian</TableHead>
                      <TableHead className="text-right">Rata-rata per Transaksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.purchasesByDay.slice(-10).reverse().map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">
                          {day.date}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(day.transactions)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.purchases)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(day.transactions > 0 ? day.purchases / day.transactions : 0)}
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

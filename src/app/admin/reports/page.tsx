'use client'

import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function ReportsIndexPage() {
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

  return (
    <AdminPageLayout title="Analitik & Laporan">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Analitik & Laporan
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pilih jenis laporan yang ingin Anda lihat untuk analisis bisnis yang mendalam.
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Laporan</CardTitle>
            <CardDescription>
              Panduan untuk menggunakan sistem laporan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Fitur Laporan:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Filter berdasarkan rentang tanggal</li>
                  <li>• Filter berdasarkan toko spesifik</li>
                  <li>• Visualisasi data dengan charts</li>
                  <li>• Export data ke Excel (XLSX)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Data Real-time:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Semua data langsung dari database</li>
                  <li>• Update otomatis setiap refresh</li>
                  <li>• Perhitungan akurat dan real-time</li>
                  <li>• Dukungan tema dark/light mode</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
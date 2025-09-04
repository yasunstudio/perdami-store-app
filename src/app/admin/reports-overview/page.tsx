import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Building2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ReportsOverviewPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Laporan Detail
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pilih jenis laporan detail yang ingin Anda lihat
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Pembayaran ke Toko
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Laporan detail pembayaran yang harus dibayar ke toko berdasarkan cost price produk. 
              Termasuk filter batch, tanggal, dan toko.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Filter berdasarkan toko, batch (siang/malam), dan tanggal</p>
              <p>• Detail per item dengan cost price</p>
              <p>• Export ke Excel dan PDF</p>
              <p>• Data customer, no telepon, catatan order</p>
            </div>
            <Link href="/admin/reports/store-payment-details">
              <Button className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Lihat Laporan
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Laporan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Laporan summary penjualan dan revenue berdasarkan harga jual ke customer.
              Analisis performa bisnis secara keseluruhan.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Summary revenue dan profit</p>
              <p>• Analisis per periode waktu</p>
              <p>• Top performing products</p>
              <p>• Customer analytics</p>
            </div>
            <Link href="/admin/reports/sales-summary">
              <Button className="w-full" variant="outline" disabled>
                <FileText className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Orders
              </Button>
            </Link>
            <Link href="/admin/stores">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="w-4 h-4 mr-2" />
                Stores
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

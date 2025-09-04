import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SalesSummaryPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/reports-overview">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Laporan Penjualan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Summary penjualan dan revenue analysis
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales Summary Report
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 space-y-4">
          <TrendingUp className="w-16 h-16 mx-auto text-gray-400" />
          <h3 className="text-xl font-semibold">Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Fitur laporan penjualan sedang dalam pengembangan. 
            Akan include summary revenue, profit analysis, dan customer analytics.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/admin/reports/store-payment-details">
              <Button>
                Lihat Laporan Pembayaran
              </Button>
            </Link>
            <Link href="/admin/analytics/order-to-stores">
              <Button variant="outline">
                Lihat Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Revenue Analysis</h4>
              <p className="text-sm text-gray-600">Total revenue, profit margins, growth trends</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Product Performance</h4>
              <p className="text-sm text-gray-600">Best selling products, revenue per product</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Customer Analytics</h4>
              <p className="text-sm text-gray-600">Customer behavior, repeat purchase analysis</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Store Payment Details</h4>
              <p className="text-sm text-gray-600">Detailed cost-based payment reports to stores</p>
              <Link href="/admin/reports/store-payment-details">
                <Button size="sm" className="mt-2">View Report</Button>
              </Link>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Order Analytics</h4>
              <p className="text-sm text-gray-600">Summary analytics and dashboard views</p>
              <Link href="/admin/analytics/order-to-stores">
                <Button size="sm" variant="outline" className="mt-2">View Analytics</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Store, 
  Clock, 
  Package,
  Users,
  Star,
  Award
} from 'lucide-react';
import { ReportData } from '../../types';

interface ReportPreviewProps {
  reportData: ReportData;
  isLoading?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  reportData,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, storeBreakdown, batchBreakdown, topProducts, timeAnalysis } = reportData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          📋 Report Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            📊 Summary Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Total Orders
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(summary.totalOrders)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Total Value
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  Stores
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatNumber(summary.storeCount)}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Avg Order
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(summary.averageOrderValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Performing Stores */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
            <Award className="w-5 h-5 mr-2" />
            🏆 Top Performing Stores
          </h3>
          <div className="grid gap-3">
            {storeBreakdown.slice(0, 5).map((storeData, index) => (
              <div
                key={storeData.store.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {storeData.store.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {storeData.metrics.completionRate.toFixed(1)}% completion rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(storeData.metrics.totalOrders)} orders
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(storeData.metrics.totalValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 mr-2" />
            ⭐ Top Products
          </h3>
          <div className="grid gap-2">
            {topProducts.slice(0, 5).map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {product.productName}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatNumber(product.totalQuantity)} units
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({product.storeCount} stores)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Analysis */}
        {timeAnalysis.peakHours.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              ⏰ Peak Hours Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeAnalysis.peakHours.slice(0, 4).map((hourData) => (
                <div
                  key={hourData.hour}
                  className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"
                >
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {hourData.hour}:00
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatNumber(hourData.orderCount)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {hourData.percentage.toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Breakdown */}
        {batchBreakdown.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              📦 Batch Performance
            </h3>
            <div className="grid gap-3">
              {batchBreakdown.map((batchData) => (
                <div
                  key={batchData.batch.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {batchData.batch.name}
                    </h4>
                    <Badge variant="secondary">
                      {formatNumber(batchData.storeCount)} stores
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Peak time: {batchData.peakTime} | 
                    Total orders: {formatNumber(batchData.batch.orderCount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

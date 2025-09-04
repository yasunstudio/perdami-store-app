'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Store, 
  Clock, 
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { ReportData, ReportFilters } from '../../types';

interface ReportSummaryProps {
  reportData: ReportData;
  filters: ReportFilters;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  reportData,
  filters
}) => {
  // Calculate summary metrics
  const totalOrders = reportData.summary.totalOrders;
  const totalValue = reportData.summary.totalValue;
  const averageOrderValue = reportData.summary.averageOrderValue;
  const storesCount = reportData.summary.storeCount;
  
  // Format filter info
  const formatDateRange = () => {
    const start = filters.dateRange.startDate.toLocaleDateString('id-ID');
    const end = filters.dateRange.endDate.toLocaleDateString('id-ID');
    return `${start} - ${end}`;
  };

  const formatBatches = () => {
    if (filters.batchIds.length === 0) return 'Semua batch';
    return filters.batchIds.map(id => {
      if (id === 'batch_1') return 'Batch 1 (Siang)';
      if (id === 'batch_2') return 'Batch 2 (Malam)';
      return id;
    }).join(', ');
  };

  const formatStores = () => {
    if (filters.storeIds.length === 0) return 'Semua toko';
    if (filters.storeIds.length <= 3) {
      return reportData.storeBreakdown
        .filter((storeReport: any) => filters.storeIds.includes(storeReport.store.id))
        .map((storeReport: any) => storeReport.store.name)
        .join(', ');
    }
    return `${filters.storeIds.length} toko dipilih`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          📊 Report Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
              <p className="text-sm font-medium">{formatDateRange()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Batch</p>
              <p className="text-sm font-medium">{formatBatches()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Toko</p>
              <p className="text-sm font-medium">{formatStores()}</p>
            </div>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalOrders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                Rp {Math.round(totalValue).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                Rp {Math.round(averageOrderValue).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Order Value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <Store className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {storesCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Stores Involved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            � {reportData.summary.batchCount} Batch(es) Analyzed
          </Badge>
          {totalOrders > 0 && (
            <Badge variant="secondary" className="text-xs">
              💰 Avg/Store: Rp {Math.round(totalValue / storesCount).toLocaleString('id-ID')}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            🕐 Generated: {new Date().toLocaleTimeString('id-ID')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

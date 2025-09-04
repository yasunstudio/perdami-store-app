'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Download, FileText } from 'lucide-react';
import { useOrderToStores } from '../../hooks';
import { ExportOptions as ExportOptionsType, QuickTemplate, DateRange } from '../../types';
import { StoreSelector } from './store-selector';
import { BatchSelector } from './batch-selector';
import { DateRangePicker } from './date-range-picker';
import { ReportPreview } from './report-preview';
import { ExportOptions } from './export-options';
import { QuickTemplates } from './quick-templates';

export const OrderToStoresMain: React.FC = () => {
  const {
    stores,
    batches,
    reportData,
    isLoading,
    error,
    filters,
    updateFilters,
    exportStatus,
    exportReport,
    generateReport,
    refreshData,
    clearError
  } = useOrderToStores();

  const handleGenerateReport = async () => {
    await generateReport();
  };

  const handleExport = async (options: ExportOptionsType) => {
    await exportReport(options);
  };

  const handleRefresh = async () => {
    clearError();
    await refreshData();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order ke Toko
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate laporan pesanan berdasarkan batch dan toko
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Quick Templates */}
      <QuickTemplates 
        onSelectTemplate={(template: QuickTemplate) => {
          if (template.filters) {
            updateFilters(template.filters);
          }
        }}
      />

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Filter & Configuration
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            💡 Tip: Biarkan kosong untuk menampilkan semua data, atau pilih toko/batch tertentu untuk filter khusus
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🏪 Select Toko
            </label>
            <StoreSelector
              stores={stores}
              selectedStoreIds={filters.storeIds}
              onSelectionChange={(storeIds: string[]) => 
                updateFilters({ storeIds })
              }
              isLoading={isLoading}
            />
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              ⏰ Select Batch
            </label>
            <BatchSelector
              batches={batches}
              selectedBatchIds={filters.batchIds}
              onSelectionChange={(batchIds: string[]) => 
                updateFilters({ batchIds })
              }
              isLoading={isLoading}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📅 Date Range
            </label>
            <DateRangePicker
              dateRange={filters.dateRange}
              onDateRangeChange={(dateRange: DateRange) => 
                updateFilters({ dateRange })
              }
            />
          </div>

          {/* Generate Report Button */}
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate Report Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <ReportPreview 
          reportData={reportData}
          isLoading={isLoading}
        />
      )}

      {/* Export Options */}
      {reportData && (
        <ExportOptions
          onExport={handleExport}
          exportStatus={exportStatus}
          reportData={reportData}
        />
      )}
    </div>
  );
};

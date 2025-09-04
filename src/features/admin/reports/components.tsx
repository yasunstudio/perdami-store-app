'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, FileText, Download, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStorePaymentDetails, usePaymentExport } from './hooks';
import { formatCurrency, formatDate, formatDateTime, getAvailableBatches, getBatchName } from './utils';

export const StorePaymentDetailsPage = () => {
  const {
    paymentDetails,
    summary,
    stores,
    isLoading,
    isLoadingStores,
    error,
    filters,
    updateFilters,
    clearFilters,
    fetchPaymentDetails,
    refreshData,
    clearError
  } = useStorePaymentDetails();

  const {
    isExporting,
    exportError,
    exportPaymentDetails,
    clearExportError
  } = usePaymentExport();

  const handleGenerateReport = async () => {
    await fetchPaymentDetails();
  };

  const handleRefresh = async () => {
    clearError();
    clearExportError();
    await refreshData();
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    await exportPaymentDetails(filters, format);
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const availableBatches = getAvailableBatches();
  const hasFilters = filters.storeId || filters.startDate || filters.endDate || filters.batchId;
  const hasData = paymentDetails.length > 0;

  if (error || exportError) {
    return (
      <div className="container mx-auto py-6 px-4 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {error || exportError}
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
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Laporan Detail Pembayaran ke Toko
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detail pembayaran per item berdasarkan cost price produk
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={isLoading || isLoadingStores}
        >
          {isLoading || isLoadingStores ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Store Filter */}
            <div className="space-y-2">
              <Label htmlFor="store-select">Pilih Toko</Label>
              <Select
                value={filters.storeId || 'all'}
                onValueChange={(value) => updateFilters({ storeId: value === 'all' ? undefined : value })}
                disabled={isLoadingStores}
              >
                <SelectTrigger id="store-select">
                  {isLoadingStores ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading stores...
                    </div>
                  ) : (
                    <SelectValue placeholder="Pilih toko..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Tanggal Mulai</Label>
              <Input
                id="start-date"
                type="date"
                value={formatDateForInput(filters.startDate)}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilters({ startDate: value ? new Date(value) : undefined });
                }}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date">Tanggal Akhir</Label>
              <Input
                id="end-date"
                type="date"
                value={formatDateForInput(filters.endDate)}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilters({ endDate: value ? new Date(value) : undefined });
                }}
              />
            </div>

            {/* Batch Filter */}
            <div className="space-y-2">
              <Label htmlFor="batch-select">Pilih Batch</Label>
              <Select
                value={filters.batchId || 'all'}
                onValueChange={(value) => updateFilters({ batchId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger id="batch-select">
                  <SelectValue placeholder="Pilih batch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {availableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.timeRange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
              
              {hasFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={isLoading}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {hasData && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  disabled={isLoading || isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Export Excel
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={isLoading || isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Summary - {summary.storeName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.totalOrders}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.totalItems}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(summary.totalCost)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Payment Details ({paymentDetails.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Tanggal Order</TableHead>
                    <TableHead className="min-w-[120px]">Batch</TableHead>
                    <TableHead className="min-w-[150px]">Customer</TableHead>
                    <TableHead className="min-w-[120px]">No Telepon</TableHead>
                    <TableHead className="min-w-[200px]">Item</TableHead>
                    <TableHead className="min-w-[80px] text-right">Jumlah</TableHead>
                    <TableHead className="min-w-[120px] text-right">Harga Satuan</TableHead>
                    <TableHead className="min-w-[120px] text-right">Total Harga</TableHead>
                    <TableHead className="min-w-[100px]">Tanggal Pickup</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentDetails.map((detail, index) => {
                    const orderHour = new Date(detail.orderDate).getHours();
                    const batchName = orderHour >= 6 && orderHour < 18 ? 'Batch 1' : 'Batch 2';
                    
                    return (
                      <TableRow key={`${detail.orderId}-${detail.itemName}-${index}`}>
                        <TableCell>{formatDateTime(detail.orderDate)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            batchName === 'Batch 1' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {batchName}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{detail.customerName}</TableCell>
                        <TableCell>{detail.customerPhone || '-'}</TableCell>
                        <TableCell>{detail.itemName}</TableCell>
                        <TableCell className="text-right">{detail.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(detail.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(detail.totalPrice)}</TableCell>
                        <TableCell>{formatDate(detail.pickupDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !isLoading && hasFilters && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No payment details found for the selected filters.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Loading overlay */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading payment details...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

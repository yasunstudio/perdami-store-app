'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorePaymentDetail, StorePaymentFilters, StorePaymentSummary, Store } from './types';
import { fetchStorePaymentDetails, fetchStores, exportStorePaymentDetails } from './api';

export const useStorePaymentDetails = () => {
  const [paymentDetails, setPaymentDetails] = useState<StorePaymentDetail[]>([]);
  const [summary, setSummary] = useState<StorePaymentSummary | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with specific date range for payment reports
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0); // Start of today
  
  // Set end date to 7 September 2025
  const endDate = new Date('2025-09-07');
  endDate.setHours(23, 59, 59, 999); // End of September 7, 2025
  
  console.log('Filter initialization:', {
    startOfToday: startOfToday.toISOString(),
    endDate: endDate.toISOString(),
    startFormatted: startOfToday.toISOString().split('T')[0],
    endFormatted: endDate.toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState<StorePaymentFilters>({
    startDate: startOfToday,
    endDate: endDate
  });

  const updateFilters = useCallback((newFilters: Partial<StorePaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0); // Start of today
    
    // Set end date to 7 September 2025
    const endDate = new Date('2025-09-07');
    endDate.setHours(23, 59, 59, 999); // End of September 7, 2025
    
    setFilters({
      startDate: startOfToday,
      endDate: endDate
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadStores = useCallback(async () => {
    try {
      setIsLoadingStores(true);
      const storesData = await fetchStores();
      setStores(storesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stores');
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  const loadPaymentDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchStorePaymentDetails(filters);
      
      if (response.success && response.data) {
        setPaymentDetails(response.data.details);
        setSummary(response.data.summary);
      } else {
        throw new Error(response.error || 'Failed to fetch payment details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment details');
      setPaymentDetails([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Auto-fetch data when filters change (with default dates)
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadPaymentDetails();
    }
  }, [loadPaymentDetails, filters.startDate, filters.endDate, filters.storeId, filters.batchId]);

  return {
    paymentDetails,
    summary,
    stores,
    isLoading,
    isLoadingStores,
    error,
    filters,
    updateFilters,
    clearFilters,
    fetchPaymentDetails: loadPaymentDetails,
    refreshData: () => Promise.all([loadStores(), loadPaymentDetails()]),
    clearError,
  };
};

export const usePaymentExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPaymentDetails = useCallback(async (
    filters: StorePaymentFilters, 
    format: 'excel' | 'pdf' = 'excel'
  ) => {
    try {
      setIsExporting(true);
      setExportError(null);

      const blob = await exportStorePaymentDetails(filters, format);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const storeName = filters.storeId ? `store-${filters.storeId}` : 'all-stores';
      const dateRange = filters.startDate && filters.endDate 
        ? `${filters.startDate.toISOString().split('T')[0]}_to_${filters.endDate.toISOString().split('T')[0]}`
        : 'all-dates';
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      
      link.download = `store-payment-details_${storeName}_${dateRange}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export payment details');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportError,
    exportPaymentDetails,
    clearExportError: () => setExportError(null),
  };
};

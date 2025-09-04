import { useState, useEffect, useCallback } from 'react';
import { 
  StoreData, 
  BatchData, 
  ReportData, 
  ReportFilters, 
  ExportOptions,
  ExportStatus 
} from '../types';

interface UseOrderToStoresReturn {
  // Data
  stores: StoreData[];
  batches: BatchData[];
  reportData: ReportData | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingStores: boolean;
  isLoadingBatches: boolean;
  isLoadingReport: boolean;
  
  // Error states
  error: string | null;
  storeError: string | null;
  batchError: string | null;
  reportError: string | null;
  
  // Filters
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  updateFilters: (updates: Partial<ReportFilters>) => void;
  
  // Export
  exportStatus: ExportStatus;
  exportReport: (options: ExportOptions) => Promise<void>;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshStores: () => Promise<void>;
  refreshBatches: () => Promise<void>;
  generateReport: () => Promise<void>;
  clearError: () => void;
}

export const useOrderToStores = (): UseOrderToStoresReturn => {
  // Data states
  const [stores, setStores] = useState<StoreData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Loading states
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  // Error states
  const [storeError, setStoreError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<ReportFilters>({
    storeIds: [],
    batchIds: [],
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date() // today
    }
  });
  
  // Export status
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    isExporting: false,
    progress: 0,
    status: 'idle'
  });
  
  // Fetch stores
  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    setStoreError(null);
    
    try {
      const response = await fetch('/api/admin/analytics/order-to-stores/stores');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data.stores || []);
    } catch (error) {
      setStoreError(error instanceof Error ? error.message : 'Failed to fetch stores');
    } finally {
      setIsLoadingStores(false);
    }
  }, []);
  
  // Fetch batches
  const fetchBatches = useCallback(async () => {
    setIsLoadingBatches(true);
    setBatchError(null);
    
    try {
      console.log('[Hook] Fetching batches...');
      
      const response = await fetch('/api/admin/analytics/order-to-stores/batches');
      
      console.log('[Hook] Batches response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Hook] Batches API error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Hook] Batches data received:', data);
      
      setBatches(data.batches || []);
    } catch (error) {
      console.error('[Hook] Error in fetchBatches:', error);
      setBatchError(error instanceof Error ? error.message : 'Failed to fetch batches');
    } finally {
      setIsLoadingBatches(false);
    }
  }, []);
  
  // Generate report
  const generateReport = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    
    try {
      console.log('[Hook] Generating report with filters:', JSON.stringify(filters, null, 2));
      
      const response = await fetch('/api/admin/analytics/order-to-stores/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filters })
      });
      
      console.log('[Hook] Preview API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Hook] Preview API error:', errorData);
        throw new Error('Failed to generate report');
      }
      
      const data = await response.json();
      console.log('[Hook] Report data received:', data);
      setReportData(data.reportData);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsLoadingReport(false);
    }
  }, [filters]);
  
  // Export report
  const exportReport = useCallback(async (options: ExportOptions) => {
    setExportStatus({
      isExporting: true,
      progress: 0,
      status: 'preparing'
    });
    
    try {
      // Simulate progress
      setExportStatus(prev => ({ ...prev, progress: 20 }));
      
      const response = await fetch('/api/admin/analytics/order-to-stores/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters,
          exportOptions: options
        })
      });
      
      setExportStatus(prev => ({ ...prev, progress: 60, status: 'generating' }));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export report');
      }
      
      const data = await response.json();
      
      setExportStatus(prev => ({ ...prev, progress: 100 }));
      
      // Final success state
      setExportStatus({
        isExporting: false,
        progress: 100,
        status: 'completed',
        downloadUrl: data.downloadUrl
      });
      
      // Don't auto-download, let user choose from the UI
      
    } catch (error) {
      setExportStatus({
        isExporting: false,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Export failed'
      });
    }
  }, [filters]);
  
  // Update filters
  const updateFilters = useCallback((updates: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchStores(),
      fetchBatches()
    ]);
  }, [fetchStores, fetchBatches]);
  
  // Clear errors
  const clearError = useCallback(() => {
    setStoreError(null);
    setBatchError(null);
    setReportError(null);
  }, []);
  
  // Initialize data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // Computed values
  const isLoading = isLoadingStores || isLoadingBatches || isLoadingReport;
  const error = storeError || batchError || reportError;
  
  return {
    // Data
    stores,
    batches,
    reportData,
    
    // Loading states
    isLoading,
    isLoadingStores,
    isLoadingBatches,
    isLoadingReport,
    
    // Error states
    error,
    storeError,
    batchError,
    reportError,
    
    // Filters
    filters,
    setFilters,
    updateFilters,
    
    // Export
    exportStatus,
    exportReport,
    
    // Actions
    refreshData,
    refreshStores: fetchStores,
    refreshBatches: fetchBatches,
    generateReport,
    clearError
  };
};

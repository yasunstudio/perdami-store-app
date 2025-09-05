import { StorePaymentFilters, StorePaymentResponse, Store } from './types';

export const fetchStorePaymentDetails = async (filters: StorePaymentFilters): Promise<StorePaymentResponse> => {
  const params = new URLSearchParams();
  
  if (filters.storeId) params.append('storeId', filters.storeId);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
  if (filters.batchId) params.append('batchId', filters.batchId);

  const response = await fetch(`/api/admin/reports/store-payment-details?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch store payment details: ${response.statusText}`);
  }

  return response.json();
};

export const fetchStores = async (): Promise<Store[]> => {
  const response = await fetch('/api/admin/reports/store-payment-details/stores');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.statusText}`);
  }

  const data = await response.json();
  return data.stores || [];
};

export const exportStorePaymentDetails = async (
  filters: StorePaymentFilters,
  format: 'excel' = 'excel'
): Promise<Blob> => {
  const params = new URLSearchParams();
  
  if (filters.storeId) params.append('storeId', filters.storeId);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
  if (filters.batchId) params.append('batchId', filters.batchId);
  params.append('format', format);

  const response = await fetch(`/api/admin/reports/store-payment-details/export?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to export payment details: ${response.statusText}`);
  }

  return response.blob();
};

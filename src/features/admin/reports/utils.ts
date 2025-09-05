import { StorePaymentDetail, StorePaymentSummary } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export const formatDateTime = (date: Date | null): string => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const calculateSummary = (details: StorePaymentDetail[], storeName: string): StorePaymentSummary => {
  const totalItems = details.reduce((sum, detail) => sum + detail.quantity, 0);
  const totalCost = details.reduce((sum, detail) => sum + detail.totalPrice, 0);
  const uniqueOrders = new Set(details.map(detail => detail.orderId));
  const totalOrders = uniqueOrders.size;

  return {
    totalItems,
    totalCost,
    totalOrders,
    storeName,
  };
};

// Get batch based on order creation time
export const getBatchFromOrderTime = (orderDate: Date): string => {
  // Convert to Indonesia timezone (UTC+7)
  const indonesiaTime = new Date(orderDate.getTime() + (7 * 60 * 60 * 1000));
  const hour = indonesiaTime.getUTCHours();
  return hour >= 6 && hour < 18 ? 'batch_1' : 'batch_2';
};

// Get batch name for display
export const getBatchName = (batchId: string): string => {
  switch (batchId) {
    case 'batch_1':
      return 'Batch 1 - Siang (06:00-18:00)';
    case 'batch_2':
      return 'Batch 2 - Malam (18:00-06:00)';
    default:
      return 'Unknown Batch';
  }
};

// Get available batches
export const getAvailableBatches = () => [
  {
    id: 'batch_1',
    name: 'Batch 1 - Siang',
    timeRange: '06:00-18:00',
    description: 'Order yang dibuat antara jam 06:00 - 18:00'
  },
  {
    id: 'batch_2', 
    name: 'Batch 2 - Malam',
    timeRange: '18:00-06:00',
    description: 'Order yang dibuat antara jam 18:00 - 06:00'
  }
];

// Check if order belongs to specified batch
export const orderBelongsToBatch = (orderDate: Date, batchId: string): boolean => {
  const orderBatch = getBatchFromOrderTime(orderDate);
  return orderBatch === batchId;
};

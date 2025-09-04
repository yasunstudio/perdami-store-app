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
  
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
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

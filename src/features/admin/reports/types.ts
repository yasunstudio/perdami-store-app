export interface StorePaymentDetail {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone: string | null;
  itemName: string;
  bundleContents?: any; // JSON data for bundle contents
  quantity: number;
  unitPrice: number; // cost price
  totalPrice: number; // quantity × cost price
  orderNotes: string | null;
  pickupDate: Date | null;
  storeId: string;
  storeName: string;
}

export interface StorePaymentFilters {
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
  batchId?: string; // 'batch_1' or 'batch_2'
}

export interface StorePaymentSummary {
  totalItems: number;
  totalCost: number;
  totalOrders: number;
  storeName: string;
}

export interface StorePaymentResponse {
  success: boolean;
  data: {
    details: StorePaymentDetail[];
    summary: StorePaymentSummary;
    filters: StorePaymentFilters;
  };
  error?: string;
}

export interface Store {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Batch {
  id: string;
  name: string;
  timeRange: string;
  description: string;
}

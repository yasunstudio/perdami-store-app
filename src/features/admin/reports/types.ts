export interface StorePaymentDetail {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone: string | null;
  itemName: string;
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

export interface StoreData {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  address?: string;
  phone?: string;
  contactPerson?: string;
  lastUpdated: Date;
}

export interface BatchData {
  id: string;
  name: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  cutoffTime: string;
  description: string;
  isActive: boolean;
  isCurrent: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  minOrderValue?: number;
  maxOrderValue?: number;
  orderStatus?: string[];
  customerType?: 'new' | 'returning' | 'all';
  hasSpecialRequests?: boolean;
}

export interface ReportFilters {
  storeIds: string[];
  batchIds: string[];
  dateRange: DateRange;
  additionalFilters?: FilterOptions;
}

export interface ExportOptions {
  format: 'excel' | 'whatsapp' | 'email' | 'pdf';
  template: 'summary' | 'detailed' | 'packing' | 'mobile';
  includeStats: boolean;
  groupByStore: boolean;
  includeCharts?: boolean;
  customFields?: string[];
}

export interface ReportData {
  summary: {
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    storeCount: number;
    batchCount: number;
  };
  storeBreakdown: StoreReportData[];
  batchBreakdown: BatchReportData[];
  topProducts: ProductSummary[];
  timeAnalysis: TimeAnalysis;
}

export interface StoreReportData {
  store: StoreData;
  orders: OrderSummary[];
  metrics: {
    totalOrders: number;
    totalValue: number;
    averageOrderValue: number;
    completionRate: number;
    preparationTime: number;
  };
}

export interface BatchReportData {
  batch: BatchData;
  storeCount: number;
  orderDistribution: {
    storeId: string;
    storeName: string;
    orderCount: number;
    percentage: number;
  }[];
  peakTime: string;
}

export interface OrderSummary {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalValue: number;
  status: string;
  pickupTime?: Date;
  specialRequests?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalValue: number;
  storeCount: number;
  rank: number;
}

export interface TimeAnalysis {
  peakHours: {
    hour: string;
    orderCount: number;
    percentage: number;
  }[];
  distribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface ExportStatus {
  isExporting: boolean;
  progress: number;
  status: 'idle' | 'preparing' | 'generating' | 'completed' | 'error';
  downloadUrl?: string;
  error?: string;
}

export interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  filters: Partial<ReportFilters>;
  exportOptions: Partial<ExportOptions>;
  isDefault?: boolean;
}

import { ExportTemplate, QuickTemplate } from '../types';

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'summary',
    name: 'Summary Report',
    description: 'Overview semua toko dalam satu sheet',
    format: 'excel',
    config: {
      includeHeaders: true,
      includeCharts: true,
      includeStatistics: true,
      groupByStore: false,
      colorScheme: 'blue',
      pageOrientation: 'landscape'
    }
  },
  {
    id: 'detailed',
    name: 'Detailed Report',
    description: 'Laporan lengkap dengan sheet terpisah per toko',
    format: 'excel',
    config: {
      includeHeaders: true,
      includeCharts: true,
      includeStatistics: true,
      groupByStore: true,
      colorScheme: 'green',
      pageOrientation: 'portrait'
    }
  },
  {
    id: 'packing',
    name: 'Packing List',
    description: 'Format untuk persiapan barang di toko',
    format: 'excel',
    config: {
      includeHeaders: true,
      includeCharts: false,
      includeStatistics: false,
      groupByStore: true,
      colorScheme: 'orange',
      fontSize: 12
    }
  },
  {
    id: 'mobile',
    name: 'Mobile Friendly',
    description: 'Format sederhana untuk viewing di mobile',
    format: 'excel',
    config: {
      includeHeaders: true,
      includeCharts: false,
      includeStatistics: true,
      groupByStore: false,
      fontSize: 14
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Format',
    description: 'Format text siap kirim ke grup WhatsApp',
    format: 'whatsapp',
    config: {
      includeHeaders: false,
      includeCharts: false,
      includeStatistics: true,
      groupByStore: true
    }
  }
];

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'daily_batch1',
    name: 'Daily Batch 1',
    description: 'Laporan harian untuk Batch 1 (Siang)',
    filters: {
      batchIds: ['batch_1'],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    },
    exportOptions: {
      format: 'excel',
      template: 'summary',
      includeStats: true,
      groupByStore: false
    },
    isDefault: true
  },
  {
    id: 'daily_batch2',
    name: 'Daily Batch 2',
    description: 'Laporan harian untuk Batch 2 (Malam)',
    filters: {
      batchIds: ['batch_2'],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    },
    exportOptions: {
      format: 'excel',
      template: 'summary',
      includeStats: true,
      groupByStore: false
    }
  },
  {
    id: 'all_stores_today',
    name: 'All Stores Today',
    description: 'Semua toko untuk hari ini',
    filters: {
      storeIds: [],
      batchIds: ['batch_1', 'batch_2'],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    },
    exportOptions: {
      format: 'excel',
      template: 'detailed',
      includeStats: true,
      groupByStore: true
    }
  },
  {
    id: 'packing_lists',
    name: 'Packing Lists',
    description: 'Daftar packing untuk semua toko',
    filters: {
      storeIds: [],
      batchIds: ['batch_1'],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    },
    exportOptions: {
      format: 'excel',
      template: 'packing',
      includeStats: false,
      groupByStore: true
    }
  },
  {
    id: 'whatsapp_broadcast',
    name: 'WhatsApp Broadcast',
    description: 'Format untuk broadcast ke grup toko',
    filters: {
      storeIds: [],
      batchIds: ['batch_1'],
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      }
    },
    exportOptions: {
      format: 'whatsapp',
      template: 'mobile',
      includeStats: true,
      groupByStore: true
    }
  }
];

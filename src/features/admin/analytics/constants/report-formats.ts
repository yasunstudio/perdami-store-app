export const REPORT_FORMATS = {
  EXCEL: 'excel',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  PDF: 'pdf'
} as const;

export const TEMPLATE_TYPES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  PACKING: 'packing',
  MOBILE: 'mobile'
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  API: 'yyyy-MM-dd',
  FILENAME: 'yyyyMMdd',
  TIME: 'HH:mm',
  DATETIME: 'dd MMM yyyy HH:mm'
} as const;

export const CURRENCY_FORMAT = {
  LOCALE: 'id-ID',
  CURRENCY: 'IDR',
  NOTATION: 'standard' as const
};

export const FILE_SIZE_LIMITS = {
  EXCEL: 50 * 1024 * 1024, // 50MB
  PDF: 20 * 1024 * 1024,   // 20MB
  CSV: 10 * 1024 * 1024    // 10MB
};

export const CACHE_DURATION = {
  STORE_DATA: 5 * 60 * 1000,      // 5 minutes
  BATCH_DATA: 2 * 60 * 1000,      // 2 minutes
  REPORT_DATA: 10 * 60 * 1000,    // 10 minutes
  EXPORT_RESULT: 60 * 60 * 1000   // 1 hour
};

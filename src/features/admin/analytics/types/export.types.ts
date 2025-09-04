export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  supportsTemplates: boolean;
  maxFileSize?: number;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  config: {
    includeHeaders: boolean;
    includeCharts: boolean;
    includeStatistics: boolean;
    groupByStore: boolean;
    colorScheme?: string;
    fontSize?: number;
    pageOrientation?: 'portrait' | 'landscape';
  };
}

export interface ExportJob {
  id: string;
  userId: string;
  filters: any;
  format: string;
  template: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
}

export interface ExportMetadata {
  filename: string;
  fileSize: number;
  recordCount: number;
  generatedAt: Date;
  expiresAt: Date;
  checksum: string;
}

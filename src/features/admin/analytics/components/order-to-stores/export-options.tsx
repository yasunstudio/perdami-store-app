'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  MessageSquare, 
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { ExportStatus, ReportData, ExportOptions as ExportOptionsType } from '../../types';
import { EXPORT_TEMPLATES } from '../../constants';

interface ExportOptionsProps {
  onExport: (options: ExportOptionsType) => Promise<void>;
  exportStatus: ExportStatus;
  reportData: ReportData;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExport,
  exportStatus,
  reportData
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('excel');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('summary');
  const [includeStats, setIncludeStats] = useState(true);
  const [groupByStore, setGroupByStore] = useState(false);

  const handleExport = async () => {
    const options: ExportOptionsType = {
      format: selectedFormat as 'excel' | 'whatsapp' | 'email' | 'pdf',
      template: selectedTemplate as 'summary' | 'detailed' | 'packing' | 'mobile',
      includeStats,
      groupByStore
    };

    await onExport(options);
  };

  const formatOptions = [
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      description: 'Comprehensive report with charts and formatting',
      icon: FileSpreadsheet,
      color: 'green',
      popular: true
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Format',
      description: 'Text format ready for WhatsApp broadcast',
      icon: MessageSquare,
      color: 'green'
    },
    {
      id: 'email',
      name: 'Email Report',
      description: 'Professional email format with attachments',
      icon: Mail,
      color: 'blue'
    },
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Print-ready formatted document',
      icon: FileText,
      color: 'red'
    }
  ];

  const availableTemplates = EXPORT_TEMPLATES.filter(template => 
    template.format === selectedFormat || selectedFormat === 'excel'
  );

  const getStatusIcon = () => {
    switch (exportStatus.status) {
      case 'preparing':
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (exportStatus.status) {
      case 'preparing':
        return 'Preparing report...';
      case 'generating':
        return 'Generating file...';
      case 'completed':
        return 'Export completed!';
      case 'error':
        return `Export failed: ${exportStatus.error}`;
      default:
        return 'Ready to export';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="w-5 h-5 mr-2" />
          📊 Export Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              
              return (
                <div
                  key={format.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  {format.popular && (
                    <Badge className="absolute -top-2 -right-2 text-xs">
                      Popular
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${
                      format.color === 'green' ? 'text-green-500' :
                      format.color === 'blue' ? 'text-blue-500' :
                      format.color === 'red' ? 'text-red-500' :
                      'text-gray-500'
                    }`} />
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {format.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Report Template
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableTemplates.map((template) => {
              const isSelected = selectedTemplate === template.id;
              
              return (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Options */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Additional Options
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Include Statistics
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add summary charts and analytics
                </p>
              </div>
              <input
                type="checkbox"
                checked={includeStats}
                onChange={(e) => setIncludeStats(e.target.checked)}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Group by Store
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create separate sections for each store
                </p>
              </div>
              <input
                type="checkbox"
                checked={groupByStore}
                onChange={(e) => setGroupByStore(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Export Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Orders:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {reportData.summary.totalOrders.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                Rp {reportData.summary.totalValue.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Stores:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {reportData.summary.storeCount}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Format:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white capitalize">
                {selectedFormat}
              </span>
            </div>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus.status !== 'idle' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {getStatusText()}
              </span>
            </div>
            
            {exportStatus.isExporting && (
              <Progress value={exportStatus.progress} className="mb-2" />
            )}
            
            {exportStatus.downloadUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(exportStatus.downloadUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Download File
              </Button>
            )}
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exportStatus.isExporting || reportData.summary.totalOrders === 0}
          size="lg"
          className="w-full"
        >
          {exportStatus.isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

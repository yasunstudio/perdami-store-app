'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { QuickTemplate } from '../../types';
import { QUICK_TEMPLATES } from '../../constants';

interface QuickTemplatesProps {
  onSelectTemplate: (template: QuickTemplate) => void;
}

export const QuickTemplates: React.FC<QuickTemplatesProps> = ({
  onSelectTemplate
}) => {
  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'daily_batch1':
      case 'daily_batch2':
        return Clock;
      case 'all_stores_today':
        return Calendar;
      case 'packing_lists':
        return FileText;
      case 'whatsapp_broadcast':
        return MessageSquare;
      default:
        return TrendingUp;
    }
  };

  const getTemplateColor = (templateId: string) => {
    switch (templateId) {
      case 'daily_batch1':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'daily_batch2':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'all_stores_today':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'packing_lists':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'whatsapp_broadcast':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          ⚡ Quick Templates
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pilih template cepat untuk report yang sering digunakan
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_TEMPLATES.map((template) => {
            const Icon = getTemplateIcon(template.id);
            const colorClass = getTemplateColor(template.id);
            
            return (
              <Button
                key={template.id}
                variant="ghost"
                className={`h-auto p-4 justify-start ${colorClass} hover:shadow-md transition-all`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start gap-3 w-full">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">
                        {template.exportOptions.format}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {template.exportOptions.template}
                      </span>
                      {template.filters.batchIds && template.filters.batchIds.length > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {template.filters.batchIds.length === 1 
                              ? `Batch ${template.filters.batchIds[0].replace('batch_', '')}`
                              : 'All Batches'
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Usage Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            💡 Tips Penggunaan
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Template akan mengisi filter otomatis sesuai konfigurasi</li>
            <li>• Anda masih bisa modify filter setelah memilih template</li>
            <li>• Template "Default" cocok untuk operasional harian</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

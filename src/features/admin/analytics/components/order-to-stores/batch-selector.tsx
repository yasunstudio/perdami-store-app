'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  Square,
  AlertCircle 
} from 'lucide-react';
import { BatchData } from '../../types';
import { BATCH_STATUS_CONFIG } from '../../constants';

interface BatchSelectorProps {
  batches: BatchData[];
  selectedBatchIds: string[];
  onSelectionChange: (batchIds: string[]) => void;
  isLoading?: boolean;
}

export const BatchSelector: React.FC<BatchSelectorProps> = ({
  batches,
  selectedBatchIds,
  onSelectionChange,
  isLoading = false
}) => {
  // Check if all batches are selected
  const isAllSelected = selectedBatchIds.length === batches.length && batches.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(batches.map(batch => batch.id));
    }
  };

  const handleBatchToggle = (batchId: string) => {
    const newSelection = selectedBatchIds.includes(batchId)
      ? selectedBatchIds.filter(id => id !== batchId)
      : [...selectedBatchIds, batchId];
    
    onSelectionChange(newSelection);
  };

  // Calculate summary for selected batches
  const selectedBatches = batches.filter(batch => selectedBatchIds.includes(batch.id));
  const totalOrders = selectedBatches.reduce((sum, batch) => sum + batch.orderCount, 0);
  const totalValue = selectedBatches.reduce((sum, batch) => sum + batch.totalValue, 0);

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Convert HH:mm:ss to HH:mm
  };

  const getBatchStatus = (batch: BatchData) => {
    if (batch.isActive) return 'active';
    if (batch.isCurrent) return 'cutoff';
    return 'upcoming';
  };

  if (isLoading) {
    return (
      <div className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Select All Button */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="flex items-center gap-2"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {isAllSelected ? 'Clear All Batches' : 'Select All Batches'}
        </Button>

        {selectedBatchIds.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedBatchIds.length} batch dipilih
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedBatchIds.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  Total: {selectedBatchIds.length} batch
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span>{totalOrders} orders</span>
                <span>Rp {totalValue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch List */}
      <div className="space-y-2">
        {batches.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              Tidak ada batch tersedia
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => {
            const isSelected = selectedBatchIds.includes(batch.id);
            const status = getBatchStatus(batch);
            const statusConfig = BATCH_STATUS_CONFIG[status as keyof typeof BATCH_STATUS_CONFIG];

            return (
              <Card
                key={batch.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleBatchToggle(batch.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleBatchToggle(batch.id)}
                    />
                    
                    <div className="flex-1 space-y-2">
                      {/* Batch Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {batch.name}
                          </h3>
                          <Badge 
                            variant={statusConfig.color === 'green' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {batch.orderCount} orders
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Rp {batch.totalValue.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Batch Details */}
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>
                            Cut-off: {formatTime(batch.cutoffTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>
                            Avg: Rp {batch.orderCount > 0 
                              ? Math.round(batch.totalValue / batch.orderCount).toLocaleString('id-ID')
                              : '0'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Time Range Description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {batch.timeRange}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Today's Summary */}
      {batches.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-3">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                📊 Today's Batch Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Batches</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {batches.length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Orders</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {batches.reduce((sum, batch) => sum + batch.orderCount, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Rp {batches.reduce((sum, batch) => sum + batch.totalValue, 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

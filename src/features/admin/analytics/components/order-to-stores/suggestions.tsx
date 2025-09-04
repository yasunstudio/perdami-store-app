'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Calendar, 
  Store, 
  Clock,
  Lightbulb
} from 'lucide-react';

interface SuggestionsProps {
  suggestions: {
    message: string;
    availableStores: Array<{ id: string; name: string }>;
    sampleOrder?: {
      date: string;
      stores: string[];
    };
    tips: string[];
  };
  onApplySuggestion: (filters: any) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onApplySuggestion
}) => {
  const handleTryAugustData = () => {
    const augustStart = new Date('2025-08-20');
    const augustEnd = new Date('2025-08-30');
    
    onApplySuggestion({
      dateRange: {
        from: augustStart,
        to: augustEnd
      },
      storeIds: [],
      batchIds: ['batch_1', 'batch_2']
    });
  };

  const handleTrySpecificStore = (storeId: string) => {
    const augustStart = new Date('2025-08-20');
    const augustEnd = new Date('2025-08-30');
    
    onApplySuggestion({
      dateRange: {
        from: augustStart,
        to: augustEnd
      },
      storeIds: [storeId],
      batchIds: ['batch_1', 'batch_2']
    });
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-5 h-5 mr-2" />
          💡 Suggestions to Get Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-700 dark:text-yellow-300">
          {suggestions.message}
        </p>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Try Different Date Range
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTryAugustData}
              className="text-xs"
            >
              📅 Try August 20-30, 2025 (Sample Data Period)
            </Button>
          </div>

          {suggestions.availableStores.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Store className="w-4 h-4 mr-1" />
                Try These Stores
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.availableStores.map((store) => (
                  <Badge 
                    key={store.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800"
                    onClick={() => handleTrySpecificStore(store.id)}
                  >
                    🏪 {store.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {suggestions.sampleOrder && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Sample Order Found
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Date: <Badge variant="secondary">{suggestions.sampleOrder.date}</Badge></p>
                <p>Stores: {suggestions.sampleOrder.stores.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-1" />
              Tips
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {suggestions.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

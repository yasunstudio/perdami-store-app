'use client';

import React, { useState, useMemo } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Store, Users, CheckSquare, Square } from 'lucide-react';
import { StoreData } from '../../types';

interface StoreSelectorProps {
  stores: StoreData[];
  selectedStoreIds: string[];
  onSelectionChange: (storeIds: string[]) => void;
  isLoading?: boolean;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  selectedStoreIds,
  onSelectionChange,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter stores based on search term
  const filteredStores = useMemo(() => {
    if (!searchTerm) return stores;
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  // Check if all stores are selected
  const isAllSelected = selectedStoreIds.length === stores.length && stores.length > 0;
  const isPartialSelected = selectedStoreIds.length > 0 && selectedStoreIds.length < stores.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(stores.map(store => store.id));
    }
  };

  const handleStoreToggle = (storeId: string) => {
    const newSelection = selectedStoreIds.includes(storeId)
      ? selectedStoreIds.filter(id => id !== storeId)
      : [...selectedStoreIds, storeId];
    
    onSelectionChange(newSelection);
  };

  const selectedStores = stores.filter(store => selectedStoreIds.includes(store.id));

  if (isLoading) {
    return (
      <div className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Select All */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari toko..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSelectAll}
          className="flex items-center gap-2"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {isAllSelected ? 'Clear All' : 'Select All'}
        </Button>
      </div>

      {/* Selection Summary */}
      {selectedStoreIds.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  {selectedStoreIds.length} toko dipilih
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span>Siap untuk generate report</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
        {filteredStores.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Tidak ada toko yang ditemukan' : 'Tidak ada toko tersedia'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredStores.map((store) => {
              const isSelected = selectedStoreIds.includes(store.id);
              
              return (
                <div
                  key={store.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleStoreToggle(store.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleStoreToggle(store.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {store.name}
                        </p>
                        {store.address && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {store.address}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs flex-shrink-0">
                        <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className="whitespace-nowrap">
                          {store.status}
                        </Badge>
                        {store.contactPerson && (
                          <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {store.contactPerson}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Stores Display */}
      {selectedStoreIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedStores.slice(0, 5).map((store) => (
            <Badge
              key={store.id}
              variant="secondary"
              className="text-xs"
            >
              {store.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStoreToggle(store.id);
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          ))}
          {selectedStoreIds.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{selectedStoreIds.length - 5} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

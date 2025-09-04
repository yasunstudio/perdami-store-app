'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CalendarDays } from 'lucide-react';
import { DateRange } from '../../types';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange
}) => {
  const [startDate, setStartDate] = useState(
    dateRange.startDate.toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    dateRange.endDate.toISOString().split('T')[0]
  );

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    const newStartDate = new Date(value);
    onDateRangeChange({
      startDate: newStartDate,
      endDate: dateRange.endDate
    });
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    const newEndDate = new Date(value);
    onDateRangeChange({
      startDate: dateRange.startDate,
      endDate: newEndDate
    });
  };

  const setToday = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setStartDate(todayString);
    setEndDate(todayString);
    onDateRangeChange({
      startDate: today,
      endDate: today
    });
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    setStartDate(yesterdayString);
    setEndDate(yesterdayString);
    onDateRangeChange({
      startDate: yesterday,
      endDate: yesterday
    });
  };

  const setThisWeek = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const todayString = today.toISOString().split('T')[0];
    const mondayString = monday.toISOString().split('T')[0];
    
    setStartDate(mondayString);
    setEndDate(todayString);
    onDateRangeChange({
      startDate: monday,
      endDate: today
    });
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-3">
      {/* Quick Date Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={setToday}
          className="flex items-center gap-1"
        >
          <Calendar className="w-3 h-3" />
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setYesterday}
          className="flex items-center gap-1"
        >
          <Calendar className="w-3 h-3" />
          Yesterday
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={setThisWeek}
          className="flex items-center gap-1"
        >
          <CalendarDays className="w-3 h-3" />
          This Week
        </Button>
      </div>

      {/* Date Inputs */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={startDate}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Display Selected Range */}
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Selected range: {formatDisplayDate(dateRange.startDate)}
                {dateRange.startDate.getTime() !== dateRange.endDate.getTime() && (
                  <> - {formatDisplayDate(dateRange.endDate)}</>
                )}
              </span>
            </div>
            
            {/* Calculate days difference */}
            {dateRange.startDate.getTime() !== dateRange.endDate.getTime() && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

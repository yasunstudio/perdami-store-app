'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

interface PickupDateOption {
  date: string // YYYY-MM-DD format
  label: string
  description: string
  disabled?: boolean
}

interface PickupDateSelectorProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
  className?: string
}

export function PickupDateSelector({ selectedDate, onDateSelect, className }: PickupDateSelectorProps) {
  const { resolvedTheme } = useTheme()
  
  // Allow pickup on September 6 and 7, 2025 (last 2 days of event)
  // This allows sufficient processing time while providing flexibility
  const pickupDates: PickupDateOption[] = [
    // {
    //   date: '2025-09-06',
    //   label: 'Sabtu, 6 September 2025',
    //   description: 'Hari kedua acara Perdami - Pickup tersedia'
    // },
    {
      date: '2025-09-07',
      label: 'Minggu, 7 September 2025', 
      description: 'Hari terakhir acara Perdami - Pickup tersedia'
    }
  ]

  return (
    <Card className={cn(
      "border-border dark:border-gray-700 bg-card dark:bg-gray-800 shadow-sm transition-colors duration-200",
      className
    )}>
      <CardHeader className={cn(
        "bg-muted/50 dark:bg-gray-700/50 border-b border-border dark:border-gray-600",
        "transition-colors duration-200"
      )}>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-gray-100">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-blue-500" />
          Pilih Tanggal Pickup
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Pickup tersedia pada hari terakhir event (7 September) untuk memastikan semua pesanan siap
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-6 bg-card dark:bg-gray-800">
        {pickupDates.map((option) => (
          <Button
            key={option.date}
            type="button"
            variant={selectedDate === option.date ? 'default' : 'outline'}
            className={cn(
              "w-full h-auto p-4 flex flex-col items-start text-left transition-all duration-200",
              "border-gray-300 dark:border-gray-600",
              "hover:bg-gray-50 dark:hover:bg-gray-700/50",
              selectedDate === option.date ? 
                "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 " +
                "bg-blue-600 dark:bg-blue-600 text-white dark:text-white border-blue-600 dark:border-blue-600" :
                "bg-background dark:bg-gray-700 text-foreground dark:text-gray-100"
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDateSelect(option.date)
            }}
            disabled={option.disabled}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className={cn(
                "h-4 w-4",
                selectedDate === option.date 
                  ? "text-white dark:text-white" 
                  : "text-blue-600 dark:text-blue-400"
              )} />
              <span className="font-medium">{option.label}</span>
            </div>
            <span className={cn(
              "text-sm",
              selectedDate === option.date 
                ? "text-white/90 dark:text-white/90" 
                : "text-gray-600 dark:text-gray-300"
            )}>
              {option.description}
            </span>
            <span className={cn(
              "text-xs mt-1",
              selectedDate === option.date 
                ? "text-white/80 dark:text-white/80" 
                : "text-gray-500 dark:text-gray-400"
            )}>
              Jam operasional: 09:00 - 17:00 WIB
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

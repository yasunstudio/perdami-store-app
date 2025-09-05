'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'
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
  // Allow pickup on September 6 and 7, 2025 (last 2 days of event)
  // This allows sufficient processing time while providing flexibility
  const pickupDates: PickupDateOption[] = [
    {
      date: '2025-09-06',
      label: 'Sabtu, 6 September 2025',
      description: 'Hari kedua acara Perdami - Pickup tersedia'
    },
    {
      date: '2025-09-07',
      label: 'Minggu, 7 September 2025',
      description: 'Hari terakhir acara Perdami - Pickup tersedia'
    }
  ]

  return (
    <Card className={cn("border-border/50 dark:border-border/30 bg-card dark:bg-card", className)}>
      <CardHeader className="bg-muted/30 dark:bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-primary" />
          Pilih Tanggal Pickup
        </CardTitle>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground/90">
          Pickup tersedia pada 2 hari terakhir event (6-7 September) untuk memastikan semua pesanan siap
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        {pickupDates.map((option) => (
          <Button
            key={option.date}
            type="button"
            variant={selectedDate === option.date ? 'default' : 'outline'}
            className={cn(
              "w-full h-auto p-4 flex flex-col items-start text-left transition-all",
              "border-border/50 dark:border-border/30",
              "hover:bg-muted/50 dark:hover:bg-muted/20",
              selectedDate === option.date && 
                "ring-2 ring-primary dark:ring-primary ring-offset-2 dark:ring-offset-background " +
                "bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground"
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
                  ? "text-primary-foreground dark:text-primary-foreground" 
                  : "text-primary dark:text-primary"
              )} />
              <span className="font-medium">{option.label}</span>
            </div>
            <span className={cn(
              "text-sm",
              selectedDate === option.date 
                ? "text-primary-foreground/80 dark:text-primary-foreground/80" 
                : "text-muted-foreground dark:text-muted-foreground/90"
            )}>
              {option.description}
            </span>
            <span className={cn(
              "text-xs mt-1",
              selectedDate === option.date 
                ? "text-primary-foreground/70 dark:text-primary-foreground/70" 
                : "text-muted-foreground dark:text-muted-foreground/80"
            )}>
              Jam operasional: 09:00 - 17:00 WIB
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

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
  // Only allow pickup on the last day of event (September 7, 2025)
  // This ensures sufficient processing time for vendors
  const pickupDates: PickupDateOption[] = [
    {
      date: '2025-09-07',
      label: 'Minggu, 7 September 2025',
      description: 'Hari terakhir acara Perdami - Pickup tersedia'
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Pilih Tanggal Pickup
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pickup tersedia pada hari terakhir event (7 September) untuk memastikan semua pesanan siap
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pickupDates.map((option) => (
          <Button
            key={option.date}
            type="button"
            variant={selectedDate === option.date ? 'default' : 'outline'}
            className={cn(
              "w-full h-auto p-4 flex flex-col items-start text-left",
              selectedDate === option.date && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDateSelect(option.date)
            }}
            disabled={option.disabled}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{option.label}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {option.description}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Jam operasional: 09:00 - 17:00 WIB
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

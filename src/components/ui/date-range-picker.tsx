"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, isAfter, isBefore } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { toast } from "@/hooks/use-toast"

export interface DateRange {
  from?: Date
  to?: Date
}

interface DatePickerWithRangeProps {
  className?: string
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  showPresets?: boolean
}

interface DatePreset {
  label: string
  range: DateRange
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
  placeholder = "Pilih rentang tanggal",
  showPresets = true,
  ...props
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [isOpen, setIsOpen] = React.useState(false)

  // Sync internal state with external value prop
  React.useEffect(() => {
    setDate(value)
  }, [value])

  // Date presets
  const presets: DatePreset[] = [
    {
      label: "Hari ini",
      range: { from: new Date(), to: new Date() }
    },
    {
      label: "7 hari terakhir",
      range: { from: subDays(new Date(), 6), to: new Date() }
    },
    {
      label: "30 hari terakhir",
      range: { from: subDays(new Date(), 29), to: new Date() }
    },
    {
      label: "Bulan ini",
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    },
    {
      label: "Bulan lalu",
      range: { 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      }
    }
  ]

  const validateDateRange = (fromDate?: Date, toDate?: Date): boolean => {
    if (!fromDate || !toDate) return true
    if (isAfter(fromDate, toDate)) {
      toast.error("Tanggal mulai tidak boleh lebih besar dari tanggal akhir")
      return false
    }
    return true
  }

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    
    if (newDate && date?.to && !validateDateRange(newDate, date.to)) {
      return
    }
    
    const newRange = { ...date, from: newDate }
    setDate(newRange)
    onChange?.(newRange)
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    
    if (newDate && date?.from && !validateDateRange(date.from, newDate)) {
      return
    }
    
    const newRange = { ...date, to: newDate }
    setDate(newRange)
    onChange?.(newRange)
  }

  const handlePresetSelect = (preset: DatePreset) => {
    setDate(preset.range)
    onChange?.(preset.range)
  }

  const handleClear = () => {
    setDate(undefined)
    onChange?.(undefined)
  }

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  const formatDateForDisplay = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: id })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              <div className="flex items-center justify-between w-full">
                <span>
                  {date.to ? (
                    <>
                      {formatDateForDisplay(date.from)} - {formatDateForDisplay(date.to)}
                    </>
                  ) : (
                    formatDateForDisplay(date.from)
                  )}
                </span>
                {(date.from || date.to) && (
                  <X 
                    className="h-4 w-4 ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClear()
                    }}
                  />
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" align="start">
          <div className="flex">
            {/* Presets */}
            {showPresets && (
              <div className="border-r border-gray-200 dark:border-gray-700 p-3 space-y-1 min-w-[140px] bg-gray-50 dark:bg-gray-900/50">
                <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Preset</div>
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-8 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={handleClear}
                >
                  Hapus
                </Button>
              </div>
            )}
            
            {/* Date inputs */}
            <div className="p-4 space-y-4 min-w-[280px] bg-white dark:bg-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={formatDateForInput(date?.from)}
                  onChange={handleFromDateChange}
                  max={formatDateForInput(date?.to)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Tanggal Akhir</label>
                <Input
                  type="date"
                  value={formatDateForInput(date?.to)}
                  onChange={handleToDateChange}
                  min={formatDateForInput(date?.from)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hapus
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
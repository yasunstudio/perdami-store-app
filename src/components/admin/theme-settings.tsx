'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Tema terang' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Tema gelap' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Ikuti sistem' },
  ]

  const currentOption = themeOptions.find(opt => opt.value === theme)

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Tema Tampilan</Label>
        <p className="text-sm text-muted-foreground">
          Pilih tema tampilan admin dashboard
        </p>
        <div className="text-xs text-muted-foreground mt-1">
          Aktif: <span className="font-medium">
            {resolvedTheme === 'dark' ? 'Gelap' : 'Terang'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Select Dropdown */}
        <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                {currentOption && <currentOption.icon className="h-4 w-4" />}
                {currentOption?.label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {themeOptions.map(({ value, label, icon: Icon, description }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Quick Toggle Buttons */}
        <div className="flex gap-1">
          {themeOptions.map(({ value, icon: Icon, description }) => (
            <Button
              key={value}
              variant={theme === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(value as any)}
              className="h-8 w-8 p-0"
              title={description}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

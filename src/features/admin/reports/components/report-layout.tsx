'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Download, RefreshCw, Calendar, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportLayoutProps {
  title?: string
  description: string
  children: ReactNode
  isLoading?: boolean
  isExporting?: boolean
  onRefresh?: () => void
  onExport?: () => void
  filters?: ReactNode
  badges?: Array<{
    label: string
    value: string | number
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  className?: string
}

export function ReportLayout({
  title,
  description,
  children,
  isLoading = false,
  isExporting = false,
  onRefresh,
  onExport,
  filters,
  badges,
  className
}: ReportLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="space-y-1">
          {title && (
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
          )}
          
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading || isExporting}
              className="flex items-center space-x-2"
            >
              <Download className={cn('h-4 w-4', isExporting && 'animate-pulse')} />
              <span>{isExporting ? 'Exporting...' : 'Export Excel'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant={badge.variant || 'secondary'}>
              {badge.label}: {badge.value}
            </Badge>
          ))}
        </div>
      )}

      {/* Filters Section */}
      {filters && (
        <div className="space-y-4">
          {filters}
          <Separator />
        </div>
      )}

      {/* Content Section */}
      <div className={cn('space-y-6', isLoading && 'opacity-50 pointer-events-none')}>
        {children}
      </div>
    </div>
  )
}

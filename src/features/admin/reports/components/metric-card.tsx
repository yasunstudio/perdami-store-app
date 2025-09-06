'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/index'

interface MetricCardProps {
  title: string
  value: number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  format?: 'currency' | 'number' | 'percentage'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  format = 'number',
  className,
  size = 'md'
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      default:
        return formatNumber(val)
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 0) {
      return <TrendingUp className="h-3 w-3" />
    } else if (trend.value < 0) {
      return <TrendingDown className="h-3 w-3" />
    } else {
      return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.isPositive === undefined) {
      return trend.value > 0 ? 'text-green-600 dark:text-green-400' : 
             trend.value < 0 ? 'text-red-600 dark:text-red-400' : 
             'text-gray-600 dark:text-gray-400'
    }
    
    return trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const sizeClasses = {
    sm: {
      card: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      icon: 'h-4 w-4'
    },
    md: {
      card: 'p-6',
      title: 'text-sm',
      value: 'text-2xl',
      icon: 'h-5 w-5'
    },
    lg: {
      card: 'p-8',
      title: 'text-base',
      value: 'text-3xl',
      icon: 'h-6 w-6'
    }
  }

  const classes = sizeClasses[size]

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className={classes.card}>
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn(classes.title, 'font-medium text-gray-600 dark:text-gray-400')}>
            {title}
          </CardTitle>
          {Icon && (
            <Icon className={cn(classes.icon, 'text-gray-400 dark:text-gray-500')} />
          )}
        </div>
        
        <div className="space-y-1">
          <div className={cn(classes.value, 'font-bold text-gray-900 dark:text-gray-100')}>
            {formatValue(value)}
          </div>
          
          {trend && (
            <div className={cn('flex items-center space-x-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {Math.abs(trend.value).toFixed(1)}% {trend.label}
              </span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricsGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function MetricsGrid({ 
  children, 
  columns = 4, 
  className 
}: MetricsGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  )
}

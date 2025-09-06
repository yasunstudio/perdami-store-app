'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '../utils/index'

interface ChartData {
  name: string
  value: number
  label?: string
}

interface SimpleChartProps {
  title: string
  description?: string
  data: ChartData[]
  type: 'bar' | 'line' | 'pie'
  className?: string
  formatValue?: 'currency' | 'number' | 'percentage'
  height?: number
}

export function SimpleChart({
  title,
  description,
  data,
  type,
  className,
  formatValue = 'number',
  height = 300
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  const formatDisplayValue = (value: number) => {
    switch (formatValue) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return formatNumber(value)
    }
  }

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDisplayValue(item.value)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {item.name}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDisplayValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPieChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = ((item.value / data.reduce((acc, curr) => acc + curr.value, 0)) * 100)
        return (
          <div key={index} className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: `hsl(${(index * 360) / data.length}, 70%, 50%)`
              }}
            />
            <div className="flex-1 flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDisplayValue(item.value)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart()
      case 'line':
        return renderLineChart()
      case 'pie':
        return renderPieChart()
      default:
        return renderBarChart()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {data.length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Tidak ada data untuk ditampilkan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

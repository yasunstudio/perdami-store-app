'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Store, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import type { StoreStats } from '../types/store.types'

interface StoreStatsCardsProps {
  stats: StoreStats | null
  loading?: boolean
}

export function StoreStatsCards({ stats, loading }: StoreStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Toko',
      value: stats?.totalStores || 0,
      description: 'Semua toko partner',
      icon: Store,
      change: stats?.growthRate || 0
    },
    {
      title: 'Toko Aktif',
      value: stats?.activeStores || 0,
      description: 'Sedang beroperasi',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Tanpa Bundle',
      value: stats?.storesWithoutBundles || 0,
      description: 'Perlu perhatian',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      title: 'Baru (30 hari)',
      value: stats?.recentStores || 0,
      description: 'Toko terbaru',
      icon: TrendingUp,
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
                {card.change !== undefined && (
                  <span className={`ml-1 ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}%
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

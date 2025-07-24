'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { UserStats } from '../types/user.types'
import { Users, Shield, UserCheck, UserPlus } from 'lucide-react'

interface UserStatsCardsProps {
  refreshTrigger?: number
}

export function UserStatsCards({ refreshTrigger }: UserStatsCardsProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/users/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [refreshTrigger])

  const statItems = [
    {
      title: 'Total Pengguna',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Pengguna terdaftar',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Admin',
      value: stats?.totalAdmins || 0,
      icon: Shield,
      description: 'Administrator',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      title: 'Customer',
      value: stats?.totalCustomers || 0,
      icon: UserCheck,
      description: 'Pelanggan',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
    },
    {
      title: 'User Baru',
      value: stats?.newUsersThisMonth || 0,
      icon: UserPlus,
      description: 'Bulan ini',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const IconComponent = item.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {item.title}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {item.value.toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
                <div className={`${item.bgColor} rounded-full p-3`}>
                  <IconComponent className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

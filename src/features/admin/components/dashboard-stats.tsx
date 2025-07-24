import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Store, Users, ShoppingCart } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalProducts: number
    totalStores: number
    totalUsers: number
    totalOrders: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      description: 'Produk tersedia',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Toko',
      value: stats.totalStores,
      icon: Store,
      description: 'Toko aktif',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: Users,
      description: 'Pengguna terdaftar',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Pesanan',
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: 'Pesanan dibuat',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium">
                {item.title}
              </CardTitle>
              <div className={`p-1.5 rounded-md ${item.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-xl font-bold">{item.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Export as default for easier import
export default DashboardStats

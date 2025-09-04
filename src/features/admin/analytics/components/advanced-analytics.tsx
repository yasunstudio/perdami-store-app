'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { TrendingUp, Package, Users, ShoppingCart, DollarSign, AlertCircle, RefreshCw } from 'lucide-react'

interface AnalyticsData {
  salesData: Array<{
    date: string
    sales: number
    orders: number
    revenue: number
  }>
  productData: Array<{
    name: string
    sales: number
    revenue: number
  }>
  storeData: Array<{
    name: string
    products: number
    sales: number
    revenue: number
  }>
  summaryStats: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
    revenueGrowth: number
    ordersGrowth: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching analytics data from APIs...')
      
      // Fetch real data from multiple API endpoints
      const [dashboardResponse, productsResponse, storesResponse] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/products/stats'),
        fetch('/api/admin/stores/stats')
      ])

      console.log('API Responses:', {
        dashboard: dashboardResponse.status,
        products: productsResponse.status,
        stores: storesResponse.status
      })

      if (!dashboardResponse.ok) {
        throw new Error(`Dashboard API failed: ${dashboardResponse.status}`)
      }
      if (!productsResponse.ok) {
        throw new Error(`Products API failed: ${productsResponse.status}`)
      }
      if (!storesResponse.ok) {
        throw new Error(`Stores API failed: ${storesResponse.status}`)
      }

      const [dashboardData, productsData, storesData] = await Promise.all([
        dashboardResponse.json(),
        productsResponse.json(),
        storesResponse.json()
      ])

      console.log('✅ All API data received:', {
        dashboard: !!dashboardData,
        products: !!productsData,
        stores: !!storesData
      })

      // Transform real data into analytics format
      const analyticsData: AnalyticsData = {
        salesData: generateSalesDataFromOrders(dashboardData.recentOrders || []),
        productData: transformProductsData(productsData),
        storeData: transformStoresData(storesData),
        summaryStats: {
          totalRevenue: dashboardData.stats?.totalRevenue || 0,
          totalOrders: dashboardData.stats?.totalOrders || 0,
          totalProducts: dashboardData.stats?.totalProducts || 0,
          totalCustomers: dashboardData.stats?.totalUsers || 0,
          revenueGrowth: dashboardData.stats?.orderGrowthRate || 0,
          ordersGrowth: dashboardData.stats?.orderGrowthRate || 0
        }
      }
      
      setData(analyticsData)
    } catch (error) {
      console.error('❌ Error fetching analytics data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics data')
      // Fallback to empty data structure
      setData({
        salesData: [],
        productData: [],
        storeData: [],
        summaryStats: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          revenueGrowth: 0,
          ordersGrowth: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Transform real orders data into sales chart data
  const generateSalesDataFromOrders = (orders: any[]) => {
    const days = 7
    const salesByDate = new Map()
    
    // Initialize with last 7 days
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd')
      salesByDate.set(date, { date, sales: 0, orders: 0, revenue: 0 })
    }
    
    // Aggregate orders by date
    orders.forEach((order: any) => {
      const orderDate = format(new Date(order.createdAt), 'yyyy-MM-dd')
      if (salesByDate.has(orderDate)) {
        const existing = salesByDate.get(orderDate)
        existing.orders += 1
        existing.revenue += order.totalAmount
        // Calculate total quantity from order items
        existing.sales += order.orderItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 1
      }
    })
    
    return Array.from(salesByDate.values())
  }

  // Transform products stats data
  const transformProductsData = (productsData: any) => {
    if (!productsData?.topSellingProducts) return []
    
    if (!productsData || !Array.isArray(productsData.topSellingProducts)) {
      return []
    }

    const transformed = productsData.topSellingProducts
      .slice(0, 5)
      .map((product: any) => ({
        name: product.name || 'Unnamed Product',
        sales: product.totalOrders || 0,
        revenue: product.totalRevenue || 0
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
    
    return transformed
  }

  // Transform stores stats data
  const transformStoresData = (storesData: any) => {
    if (!storesData?.topStoresByProducts) return []
    
    const transformed = storesData.topStoresByProducts
      .slice(0, 4)
      .map((store: any) => ({
        name: store.name || 'Unnamed Store',
        products: store.totalBundles || 0,
        sales: store.totalOrders || 0,
        revenue: store.totalRevenue || 0
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue)
    
    console.log('Stores data transformed:', transformed)
    return transformed
  }

  if (error) {
    return (
      <Card className="p-8">
        <CardContent className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summaryStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${data.summaryStats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {data.summaryStats.revenueGrowth > 0 ? '+' : ''}{data.summaryStats.revenueGrowth}%
              </span>
              {' '}dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summaryStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <span className={`inline-flex items-center ${data.summaryStats.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {data.summaryStats.ordersGrowth > 0 ? '+' : ''}{data.summaryStats.ordersGrowth}%
              </span>
              {' '}dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summaryStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produk aktif di semua toko
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summaryStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Pengguna terdaftar aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="stores">Toko</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trend Revenue</CardTitle>
                <CardDescription>Revenue harian dalam 7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                    />
                    <YAxis tickFormatter={(value) => `${value/1000000}M`} />
                    <Tooltip 
                      labelFormatter={(value) => format(parseISO(value as string), 'dd MMM yyyy', { locale: id })}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Revenue summary */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(data.salesData.reduce((sum, day) => sum + day.revenue, 0))}
                    </p>
                    <p className="text-sm text-gray-600">Total Revenue 7 Hari</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.salesData.reduce((sum, day) => sum + day.revenue, 0) / 7)}
                    </p>
                    <p className="text-sm text-gray-600">Rata-rata Harian</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Pesanan</CardTitle>
                <CardDescription>Jumlah pesanan harian dengan detail</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(parseISO(value as string), 'dd MMM yyyy', { locale: id })}
                      formatter={(value: number) => [`${value} pesanan`, 'Pesanan']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
                    >
                      <LabelList 
                        dataKey="orders" 
                        position="top" 
                        formatter={(value: any) => `${value}`}
                        style={{ fill: '#374151', fontSize: '11px', fontWeight: 'bold' }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Orders summary */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {data.salesData.reduce((sum, day) => sum + day.orders, 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Pesanan 7 Hari</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(data.salesData.reduce((sum, day) => sum + day.orders, 0) / 7)}
                    </p>
                    <p className="text-sm text-gray-600">Rata-rata Harian</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
              <CardDescription>Top 5 produk berdasarkan penjualan dengan nilai detail</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.productData} layout="horizontal" margin={{ top: 20, right: 80, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax + 5']} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'sales' ? `${value} terjual` : formatCurrency(value),
                    name === 'sales' ? 'Terjual' : 'Revenue'
                  ]} />
                  <Bar dataKey="sales" fill="#8884d8" barSize={40}>
                    <LabelList 
                      dataKey="sales" 
                      position="right" 
                      formatter={(value: any) => `${value} unit`}
                      style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Detail table untuk informasi lengkap */}
              <div className="mt-4 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Produk</th>
                      <th className="px-4 py-2 text-right">Terjual</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.productData.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 font-medium">{product.name}</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-600">
                          {product.sales} unit
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-600">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performa Toko</CardTitle>
              <CardDescription>Perbandingan revenue dan produk antar toko</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.storeData} margin={{ top: 20, right: 80, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => `${value/1000000}M`} />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : `${value} produk`,
                    name === 'revenue' ? 'Revenue' : 'Produk'
                  ]} />
                  <Bar dataKey="revenue" fill="#0088FE" name="revenue" maxBarSize={60}>
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      formatter={(value: any) => `${(value/1000000).toFixed(1)}M`}
                      style={{ fill: '#374151', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Detail table untuk informasi lengkap */}
              <div className="mt-4 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Toko</th>
                      <th className="px-4 py-2 text-right">Total Produk</th>
                      <th className="px-4 py-2 text-right">Penjualan</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.storeData.map((store, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 font-medium">{store.name}</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-600">
                          {store.products} produk
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-orange-600">
                          {store.sales} terjual
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-600">
                          {formatCurrency(store.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

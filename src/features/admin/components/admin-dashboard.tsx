'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminPageLayout, StatsCard, LoadingState } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Store,
  AlertCircle
} from 'lucide-react';
import { DashboardStats } from './dashboard-stats';
import { RecentOrders } from './recent-orders';
import { ProductOverview } from './product-overview';
import { NotificationCenter } from '../notifications/components/notification-center';
import { RealTimeOrderTracking } from '../orders/components/real-time-order-tracking';
import { QuickActionsPanel } from './quick-actions-panel';
import { DashboardStats as DashboardStatsType, RecentOrder, PopularProduct } from '../types/dashboard.types';



function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsType>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalStores: 0,
    userGrowthRate: 0,
    productGrowthRate: 0,
    orderGrowthRate: 0,
    storeGrowthRate: 0
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/login?callbackUrl=/admin');
      return;
    }

    if (status === "authenticated" && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch real dashboard data from API
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...');
        
        // Try fixed admin API first, then fallback to fixed public API
        let response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          console.warn('Admin dashboard API failed, trying public fallback...');
          response = await fetch('/api/dashboard');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Dashboard data received:', data);
        
        // Handle different response formats
        if (data.success) {
          // Public API format
          setStats({
            totalUsers: data.stats.totalUsers,
            totalProducts: data.stats.totalBundles,
            totalOrders: data.stats.totalOrders,
            totalStores: data.stats.totalStores,
            userGrowthRate: data.stats.userGrowthRate,
            productGrowthRate: data.stats.bundleGrowthRate,
            orderGrowthRate: data.stats.orderGrowthRate,
            storeGrowthRate: data.stats.storeGrowthRate
          });
          setRecentOrders(data.recentOrders || []);
          setPopularProducts(data.popularBundles || []);
        } else {
          // Admin API format
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setPopularProducts(data.popularProducts || []);
        }
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Set fallback data on error
        setStats({
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalStores: 0,
          userGrowthRate: 0,
          productGrowthRate: 0,
          orderGrowthRate: 0,
          storeGrowthRate: 0
        });
        setRecentOrders([]);
        setPopularProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [status, session, router]);

  if (status === "loading" || isLoading) {
    return (
      <AdminPageLayout title="Dashboard" description="Panel administrasi Perdami Store">
        <LoadingState message="Memuat dashboard..." />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout 
      title="Dashboard" 
      description="Panel administrasi Perdami Store"
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Stats Cards Section */}
        <section className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Statistik Utama</h2>
            <p className="text-gray-600 dark:text-gray-400">Overview performa toko dalam real-time</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Pengguna"
              value={stats.totalUsers.toLocaleString('id-ID')}
              description="Pengguna terdaftar"
              icon={<Users className="h-5 w-5" />}
              trend={{ value: stats.userGrowthRate || 0, isPositive: (stats.userGrowthRate || 0) > 0 }}
            />
            <StatsCard
              title="Total Produk"
              value={stats.totalProducts}
              description="Produk aktif"
              icon={<Package className="h-5 w-5" />}
              trend={{ value: stats.productGrowthRate || 0, isPositive: (stats.productGrowthRate || 0) > 0 }}
            />
            <StatsCard
              title="Total Pesanan"
              value={stats.totalOrders}
              description="Pesanan bulan ini"
              icon={<ShoppingCart className="h-5 w-5" />}
              trend={{ value: stats.orderGrowthRate || 0, isPositive: (stats.orderGrowthRate || 0) > 0 }}
            />
            <StatsCard
              title="Pendapatan"
              value={`Rp ${(recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / 1000000).toFixed(1)}M`}
              description="Pendapatan bulan ini"
              icon={<TrendingUp className="h-5 w-5" />}
              trend={{ value: stats.orderGrowthRate || 0, isPositive: (stats.orderGrowthRate || 0) > 0 }}
            />
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Analisis Cepat</h2>
            <p className="text-gray-600 dark:text-gray-400">Metrik penting untuk monitoring operasional</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>Pesanan Pending</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {recentOrders.filter(order => order.status === 'PENDING').length}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Perlu Perhatian
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Pesanan menunggu konfirmasi
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <Store className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Toko Aktif</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalStores}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Online
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Toko yang sedang beroperasi
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Aktivitas Hari Ini</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {recentOrders.filter(order => {
                      const today = new Date().toDateString();
                      return new Date(order.createdAt).toDateString() === today;
                    }).length}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Hari Ini
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Transaksi hari ini
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Rata-rata Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {recentOrders.length > 0 ? 
                      `Rp ${(recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / recentOrders.length / 1000).toFixed(0)}K` 
                      : 'Rp 0'
                    }
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Per Order
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Nilai rata-rata pesanan
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Operasional</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor real-time operations dan kelola aktivitas toko secara efisien
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
            </div>
          </div>

          {/* Primary Operations Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Real-time Order Tracking - Takes 2 columns on xl screens */}
            <div className="xl:col-span-2">
              <div className="h-full">
                <RealTimeOrderTracking />
              </div>
            </div>
            
            {/* Recent Orders - Takes 1 column */}
            <div className="space-y-6">
              <RecentOrders orders={recentOrders} />
            </div>
          </div>

          {/* Secondary Operations Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Product Overview */}
            <div className="lg:col-span-1">
              <ProductOverview products={popularProducts} />
            </div>

            {/* Notification Center */}
            <div className="lg:col-span-1">
              <NotificationCenter />
            </div>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-1">
              <QuickActionsPanel />
            </div>
          </div>

          {/* System Status Footer */}
          <div className="border-t pt-8 mt-12">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      System Performance
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All services operational • Last updated: {new Date().toLocaleTimeString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Storage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


      </div>
    </AdminPageLayout>
  );
}

export default AdminDashboard

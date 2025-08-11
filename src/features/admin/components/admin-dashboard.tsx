'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminPageLayout, StatsCard, LoadingState } from '@/components/admin/admin-page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Store,
  AlertCircle
} from 'lucide-react';
import { RecentOrders } from './recent-orders';
import { ProductOverview } from './product-overview';
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
        
        // Use the admin dashboard API that we know works
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Dashboard data received:', data);
        
        // Set stats from admin API response
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          totalProducts: data.stats.totalProducts || 0,
          totalOrders: data.stats.totalOrders || 0,
          totalStores: data.stats.totalStores || 0,
          userGrowthRate: data.stats.userGrowthRate || 0,
          productGrowthRate: data.stats.productGrowthRate || 0,
          orderGrowthRate: data.stats.orderGrowthRate || 0,
          storeGrowthRate: data.stats.storeGrowthRate || 0
        });
        
        // Set recent orders and popular products
        setRecentOrders(data.recentOrders || []);
        setPopularProducts(data.popularProducts || []);
        
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Stats Cards Section - Simplified */}
        <section className="space-y-4">
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

        {/* Quick Overview Cards - Simplified and consolidated */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pesanan Pending</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {recentOrders.filter(order => order.status === 'PENDING').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Toko Aktif</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.totalStores}
                    </p>
                  </div>
                  <Store className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Hari Ini</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {recentOrders.filter(order => {
                        const today = new Date().toDateString();
                        return new Date(order.createdAt).toDateString() === today;
                      }).length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rata-rata Order</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {recentOrders.length > 0 ? 
                        `${(recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / recentOrders.length / 1000).toFixed(0)}K` 
                        : '0'
                      }
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content Grid - Two Equal Columns */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div>
              <RecentOrders orders={recentOrders} />
            </div>
            
            {/* Popular Products */}
            <div>
              <ProductOverview products={popularProducts} />
            </div>
          </div>
        </section>
      </div>
    </AdminPageLayout>
  );
}

export default AdminDashboard

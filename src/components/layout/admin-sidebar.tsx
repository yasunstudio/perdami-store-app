'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Store, 
  Users, 
  ShoppingCart,
  Settings,
  Shield,
  Menu,
  X,
  BarChart3,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  Cog,
  UserCheck,
  UserX,
  PackagePlus,
  PackageCheck,
  ShoppingBag,
  PieChart,
  Activity,
  Briefcase,
  ShoppingBasket,
  Tags,
  ClipboardList,
  BarChart,
  FileText,
  UserCog,
  Wrench,
  Phone,
  Clock,
  AlertCircle,
  QrCode,
  LayoutGrid
} from 'lucide-react';

// Import new components and utilities
import { NavigationItem } from './sidebar/navigation-item';
import { SIDEBAR_CONFIG } from '@/constants/sidebar';
import { SidebarItem, SidebarContextType } from '@/types/sidebar';
import { 
  isActiveNavItem, 
  getActiveParents, 
  filterNavigationByPermission 
} from '@/utils/sidebar';
import { usePermissions } from '@/components/guards/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { useSession, signOut } from 'next-auth/react';
import { RoleIndicator } from '@/components/ui/role-indicator';

// Create a context for sidebar state
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0 });
  
  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      setIsCollapsed, 
      isMobileMenuOpen, 
      setIsMobileMenuOpen,
      activeSubmenu,
      setActiveSubmenu,
      submenuPosition,
      setSubmenuPosition
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  permissions: string[];
  badge?: string;
  children?: NavigationItem[];
}

const navigation: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: PERMISSIONS.REPORTS_READ
  },
  {
    name: 'Manajemen Pesanan',
    href: '/admin/orders',
    icon: ClipboardList,
    permission: PERMISSIONS.ORDERS_READ
  },
  {
    name: 'Pickup Scanner',
    href: '/admin/pickup-scanner',
    icon: QrCode,
    permission: PERMISSIONS.ORDERS_READ
  },
  {
    name: 'Manajemen Bisnis',
    href: '/admin/business',
    icon: Briefcase,
    permission: PERMISSIONS.STORES_READ,
    children: [
      {
        name: 'Manajemen Toko',
        href: '/admin/stores',
        icon: Store,
        permission: PERMISSIONS.STORES_READ
      },
      {
        name: 'Paket Produk',
        href: '/admin/bundles',
        icon: PackageCheck,
        permission: PERMISSIONS.BUNDLES_READ
      },
      {
        name: 'Manajemen Bank',
        href: '/admin/banks',
        icon: Building2,
        permission: PERMISSIONS.STORES_READ
      }
    ]
  },
  {
    name: 'Analitik & Laporan',
    href: '/admin/analytics',
    icon: BarChart,
    permission: PERMISSIONS.REPORTS_READ,
    children: [
      {
        name: 'Laporan & Analisis',
        href: '/admin/reports',
        icon: BarChart,
        permission: PERMISSIONS.REPORTS_READ
      },
      {
        name: 'Pembayaran ke Toko',
        href: '/admin/reports/store-payment-details',
        icon: Building2,
        permission: PERMISSIONS.REPORTS_READ
      },
      {
        name: 'Log Aktivitas',
        href: '/admin/audit-logs',
        icon: Activity,
        permission: PERMISSIONS.AUDIT_LOGS_READ
      }
    ]
  },
  {
    name: 'Pengaturan Sistem',
    href: '/admin/system',
    icon: Wrench,
    permission: PERMISSIONS.SETTINGS_READ,
    children: [
      {
        name: 'Manajemen Pengguna',
        href: '/admin/users',
        icon: Users,
        permission: PERMISSIONS.USERS_READ
      },
      {
        name: 'Profil Administrator',
        href: '/admin/profile',
        icon: UserCog,
        permission: PERMISSIONS.USERS_READ
      },
      {
        name: 'Informasi Kontak',
        href: '/admin/contact',
        icon: Phone,
        permission: PERMISSIONS.SETTINGS_READ
      },
      {
        name: 'Konfigurasi Sistem',
        href: '/admin/settings',
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_READ
      },
      {
        name: 'Manajemen Notifikasi',
        href: '/admin/notifications',
        icon: Bell,
        permission: PERMISSIONS.USERS_READ
      }
    ]
  }
];

export function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Manajemen Bisnis']);
  const { isCollapsed, setIsCollapsed, activeSubmenu, setActiveSubmenu } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();
  const { data: session } = useSession();

  // Auto-expand parent menu when child is active
  React.useEffect(() => {
    if (pathname) {
      const activeParents = getActiveParents(navigation, pathname);
      setExpandedItems(prev => {
        const newExpanded = [...new Set([...prev, ...activeParents])];
        return newExpanded;
      });
    }
  }, [pathname]);

  // Navigation handler
  const handleNavigate = useCallback(async (href: string) => {
    console.log('AdminSidebar: Navigating to:', href);
    
    try {
      // Use Next.js router for smooth navigation without page reload
      router.push(href);
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to window.location only if router fails
      if (typeof window !== 'undefined') {
        window.location.href = href;
      }
    }
  }, [router]);

  // Filter navigation items based on permissions
  const accessibleNavigation = navigation.filter(item => 
    !item.permission || hasAnyPermission([item.permission] as any)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child =>
      !child.permission || hasAnyPermission([child.permission] as any)
    )
  }));

  const toggleExpanded = (itemName: string) => {
    if (isCollapsed) return;
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };



  const isActiveItem = (href: string) => {
    if (!pathname) return false;
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Enhanced hover behavior for collapsed state
  const shouldShowExpanded = !isCollapsed;

  const SidebarContent = () => (
    <div 
      className={cn(
        "flex flex-col h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-700/60 transition-all duration-300 ease-in-out shadow-xl relative",
        // Enhanced professional styling
        "ring-1 ring-black/5 dark:ring-white/10"
      )}
    >
      {/* Note: HoverOverlay removed - NavigationItem handles submenu popups directly */}



      {/* Professional Header with Enhanced Styling */}
      <div className={cn(
        "flex items-center border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-800 dark:via-blue-900/20 dark:to-gray-800 transition-all duration-200",
        isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-4 space-x-3"
      )}>
        {shouldShowExpanded ? (
          <>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-500/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Perdami Admin
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dashboard Manajemen
              </p>
            </div>
          </>
        ) : (
          <div 
            className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all duration-200 hover:scale-110"
            title="Perdami Admin Dashboard"
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
        )}
        

      </div>

      {/* Enhanced Professional User Info */}
      {shouldShowExpanded ? (
        <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 via-blue-50/20 to-gray-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-800 ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-emerald-500/20">
              <span className="text-sm font-bold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {session?.user?.name || 'Administrator'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session?.user?.email || 'admin@perdami.com'}
              </p>
              <div className="flex items-center space-x-2 mt-1.5">
                <RoleIndicator 
                  role={(session?.user as any)?.role || 'ADMIN'} 
                  size="sm" 
                  showIcon={true}
                />
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex justify-center">
            <div 
              className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all duration-200 hover:scale-110 relative"
              title={`${session?.user?.name || 'Administrator'} (${(session?.user as any)?.role || 'Administrator'}) - Online`}
            >
              <span className="font-bold text-white text-sm">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
              {/* Online indicator for collapsed state */}
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto",
        isCollapsed ? "px-2 py-2" : "px-3 py-3"
      )}>
        {accessibleNavigation.map((item) => {
          const isActive = isActiveNavItem(item.href, pathname || '');
          const isExpanded = expandedItems.includes(item.name);
          
          return (
            <div key={item.name} className="w-full">
              <NavigationItem
                item={item}
                isActive={isActive}
                isCollapsed={isCollapsed}
                isExpanded={isExpanded}
                expandedItems={expandedItems}
                onToggleExpanded={toggleExpanded}
                onNavigate={handleNavigate}
                shouldShowExpanded={shouldShowExpanded}
                onMobileMenuClose={() => setIsMobileMenuOpen(false)}
              />
            </div>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* Quick Actions */}
      <div className={cn(
        "space-y-1",
        isCollapsed ? "px-2 py-2" : "px-3 py-3"
      )}>
        {shouldShowExpanded && (
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 mb-2 uppercase tracking-wide">
            Quick Actions
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 rounded-lg",
            isCollapsed ? "h-10 px-2 justify-center" : "h-10 justify-start px-3"
          )}
          onClick={() => signOut({ callbackUrl: '/' })}
          title={isCollapsed ? "Keluar dari Sistem" : undefined}
        >
          <LogOut className={cn(
            isCollapsed ? "h-4 w-4" : "h-4 w-4 mr-3"
          )} />
          {shouldShowExpanded && <span>Keluar dari Sistem</span>}
        </Button>
      </div>

      {/* Footer */}
      {shouldShowExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-center space-y-1">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Perdami Store Admin
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              v1.2.0 • © 2025 PIT PERDAMI
            </div>
            <div className="flex items-center justify-center space-x-1 mt-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-600 dark:text-green-400">
                System Online
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Global backdrop for submenu - Handles click outside */}
      {isCollapsed && activeSubmenu && (
        <div 
          className="fixed inset-0 bg-transparent z-[85]" 
          onClick={() => setActiveSubmenu(null)}
        />
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar - Ukuran Lebih Kompak */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 z-50 overflow-visible",
        isCollapsed ? "lg:w-16" : "lg:w-80"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}

'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/notification-bell';

import { 
  Bell, 
  Search,
  Moon,
  Sun,
  ArrowLeft,
  Shield,
  User,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/layout/admin-sidebar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Breadcrumb mapping for admin pages
const breadcrumbMap: Record<string, { title: string; parent?: string }> = {
  '/admin': { title: 'Dashboard' },
  '/admin/bundles': { title: 'Paket Produk', parent: 'Manajemen' },
  '/admin/stores': { title: 'Toko & Penjual' },
  '/admin/users': { title: 'Pengguna' },
  '/admin/orders': { title: 'Pesanan' },
  '/admin/settings': { title: 'Pengaturan', parent: 'Sistem' },
  '/admin/profile': { title: 'Profil Admin' },
  '/admin/reports': { title: 'Laporan & Analisis' },
  '/admin/audit-logs': { title: 'Audit Log', parent: 'Sistem' },
};

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPage = pathname ? breadcrumbMap[pathname] : null;
  const pageTitle = currentPage?.title || 'Admin Dashboard';
  const parentTitle = currentPage?.parent;

  return (
    <header className="h-16 min-h-16 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-sm backdrop-blur-sm transition-all duration-300 w-full max-w-full relative z-50">
      {/* Left side - Sidebar Toggle & Page Title */}
      <div className="flex items-center min-w-0 flex-1 max-w-full space-x-3">
        {/* Sidebar Toggle Button - Professional */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 flex-shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </Button>
        
        <div className="min-w-0 flex-1 max-w-full">
          {/* Page Title */}
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate max-w-full">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right side - Search, Actions, and User Menu - Lebih Kompak */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
        {/* Search (hidden on mobile) */}
        <div className="hidden md:block">
          <Button variant="outline" size="sm" className="w-40 lg:w-48 h-8 justify-start text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Search className="h-3 w-3 mr-1.5" />
            <span className="text-xs">Cari...</span>
            <kbd className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </Button>
        </div>

        {/* Search mobile */}
        <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Search className="h-3 w-3" />
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-3 w-3 text-amber-500" />
            ) : (
              <Moon className="h-3 w-3 text-blue-600" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" />



        {/* User menu with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-1.5 pl-1.5 pr-2 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Avatar className="h-5 w-5">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                <AvatarFallback className="text-xs">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-xs font-medium text-gray-700 dark:text-gray-300">
                {session?.user?.name?.split(' ')[0] || 'Admin'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
               <DropdownMenuLabel className="font-normal">
                 <div className="flex flex-col space-y-2">
                   <div className="flex items-center gap-2">
                     <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                     <p className="text-sm font-medium leading-none">
                       {session?.user?.name || 'Admin'}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <User className="h-3 w-3 text-muted-foreground" />
                     <p className="text-xs leading-none text-muted-foreground">
                       {session?.user?.email}
                     </p>
                   </div>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               
               <DropdownMenuItem 
                 className="cursor-pointer flex items-center"
                 onClick={() => router.push('/')}
               >
                 <ArrowLeft className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                 <span>Kembali ke Frontend</span>
               </DropdownMenuItem>
             </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

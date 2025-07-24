'use client';

import { AdminSidebar, SidebarProvider, useSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminRouteGuard } from '@/components/guards/admin-route-guard';

import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import '@/styles/admin-consistent.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full max-w-full relative">
      {/* Admin Layout with Sidebar Context */}
      <div className="flex h-screen w-full max-w-full relative">
        {/* Sidebar */}
        <div className="relative z-40">
          <AdminSidebar />
        </div>
        
        {/* Main Content Area - Responsive margin based on sidebar state */}
        <div className={cn(
          "flex-1 flex flex-col w-full max-w-full transition-all duration-300 h-screen overflow-hidden",
          // Mobile: no margin, Desktop: margin based on sidebar state
          "ml-0",
          isCollapsed ? "lg:ml-16" : "lg:ml-80"
        )}>
          {/* Admin Header - Fixed */}
          <div className="flex-shrink-0 sticky top-0 z-30 bg-white dark:bg-gray-800 border-b">
            <AdminHeader />
          </div>
          
          {/* Content and Activity Feed Container */}
          <div className="flex-1 flex w-full max-w-full min-h-0 overflow-hidden">
            {/* Main Content with proper spacing */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 w-full max-w-full relative">
              <div className="w-full max-w-full h-full">
                {/* Content wrapper with responsive spacing from sidebar and activity feed */}
                <div className={cn(
                  "w-full max-w-full transition-all duration-300 h-full"
                )}>
                  {children}
                </div>
              </div>
            </main>
            

          </div>
        </div>
      </div>

      {/* Admin Toast Container */}
      <Toaster 
        position="bottom-right" 
        theme="system"
        richColors
        expand={false}
        visibleToasts={5}
        closeButton
        toastOptions={{
          duration: 3000,
          className: 'toast-message'
        }}
      />
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminRouteGuard>
      <SidebarProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </SidebarProvider>
    </AdminRouteGuard>
  );
}

'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { FooterContainer } from './footer-container';
import { Toaster } from '@/components/ui/sonner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route is admin route
  const isAdminRoute = pathname?.startsWith('/admin') || false;
  
  // For admin routes, don't wrap with main layout (admin has its own layout)
  if (isAdminRoute) {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    );
  }
  
  // For public/customer routes, use main layout (header + footer)
  return (
    <SessionProvider>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <FooterContainer />
      </div>
      <Toaster 
        richColors 
        position="bottom-right"
        expand={false}
        visibleToasts={5}
        closeButton
        toastOptions={{
          duration: 3000,
          className: 'toast-message'
        }}
      />
    </SessionProvider>
  );
}

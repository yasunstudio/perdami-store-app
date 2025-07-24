'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AdminRouteGuardProps {
  children: React.ReactNode
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  console.log('🔒 AdminRouteGuard - Status:', status);
  console.log('🔒 AdminRouteGuard - Session:', session);
  console.log('🔒 AdminRouteGuard - Pathname:', pathname);
  
  useEffect(() => {
    console.log('🔒 AdminRouteGuard useEffect - Status:', status, 'Session:', !!session, 'Role:', session?.user?.role);
    
    if (status === 'loading') {
      console.log('🔒 Still loading session...');
      return; // Still loading
    }
    
    // Check if user is authenticated
    if (!session) {
      console.log('🔒 No session found, redirecting to login with callback:', pathname);
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      console.log('🔒 User is not admin, role:', session.user.role, 'redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('🔒 AdminRouteGuard: Access granted for admin user');
  }, [session, status, router, pathname]);
  
  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Don't render children if not authenticated or not admin
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }
  
  return <>{children}</>;
}

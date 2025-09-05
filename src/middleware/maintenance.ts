import { NextRequest, NextResponse } from 'next/server'
import { getMaintenanceStatus, isAdminUser, isProtectedRoute } from '@/lib/maintenance'
import { auth } from '@/lib/auth'

/**
 * Maintenance middleware logic with comprehensive error handling
 */
export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  try {
    // Skip maintenance check for certain paths
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/icons') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/screenshots') ||
      pathname === '/maintenance' ||
      pathname === '/maintenance/'
    ) {
      return NextResponse.next()
    }
    
    // Get maintenance status with timeout
    const isMaintenanceMode = await Promise.race([
      getMaintenanceStatus(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Maintenance check timeout')), 3000)
      )
    ])
    
    // If not in maintenance mode, continue normally
    if (!isMaintenanceMode) {
      return NextResponse.next()
    }
    
    // Check if user is admin (admin bypass)
    let session = null
    try {
      session = await Promise.race([
        auth(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 2000)
        )
      ])
    } catch (authError) {
      console.warn('Auth check failed during maintenance:', authError)
      // Continue without admin privileges
    }
    
    if (isAdminUser(session)) {
      console.log('🔧 Maintenance: Admin user bypassed for', pathname)
      return NextResponse.next()
    }
    
    // Check if route is protected (shopping routes)
    if (isProtectedRoute(pathname)) {
      console.log('🔧 Maintenance: Redirecting protected route', pathname)
      // Redirect to maintenance page
      const maintenanceUrl = new URL('/maintenance', request.url)
      return NextResponse.redirect(maintenanceUrl)
    }
    
    // Allow access to non-protected routes (auth, etc)
    console.log('🔧 Maintenance: Allowing non-protected route', pathname)
    return NextResponse.next()
    
  } catch (error) {
    console.error('Error in maintenance middleware:', error)
    
    // Fail-safe: on critical errors, allow access but log the issue
    // This prevents the entire app from breaking due to maintenance check failures
    console.warn('🔧 Maintenance middleware failed, allowing access to:', pathname)
    return NextResponse.next()
  }
}

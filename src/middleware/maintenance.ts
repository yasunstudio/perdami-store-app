import { NextRequest, NextResponse } from 'next/server'
import { getMaintenanceStatus, isAdminUser, isProtectedRoute } from '@/lib/maintenance'
import { auth } from '@/lib/auth'

/**
 * Maintenance middleware logic
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
      pathname === '/maintenance'
    ) {
      return NextResponse.next()
    }
    
    // Get maintenance status
    const isMaintenanceMode = await getMaintenanceStatus()
    
    // If not in maintenance mode, continue normally
    if (!isMaintenanceMode) {
      return NextResponse.next()
    }
    
    // Check if user is admin (admin bypass)
    const session = await auth()
    if (isAdminUser(session)) {
      return NextResponse.next()
    }
    
    // Check if route is protected (shopping routes)
    if (isProtectedRoute(pathname)) {
      // Redirect to maintenance page
      const maintenanceUrl = new URL('/maintenance', request.url)
      return NextResponse.redirect(maintenanceUrl)
    }
    
    // Allow access to non-protected routes (auth, etc)
    return NextResponse.next()
    
  } catch (error) {
    console.error('Error in maintenance middleware:', error)
    // On error, allow access (fail-safe)
    return NextResponse.next()
  }
}

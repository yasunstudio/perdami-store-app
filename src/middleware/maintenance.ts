import { NextRequest, NextResponse } from 'next/server'
import { isProtectedRoute } from '@/lib/maintenance'

/**
 * Get maintenance status via API call (Edge Runtime compatible)
 */
async function getMaintenanceStatus(): Promise<boolean> {
  try {
    // Use API endpoint instead of direct database access
    const response = await fetch(new URL('/api/maintenance', process.env.NEXTAUTH_URL || 'http://localhost:3000'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.isMaintenanceMode ?? false
    }
    
    console.warn('Failed to fetch maintenance status, defaulting to false')
    return false
  } catch (error) {
    console.error('Error fetching maintenance status:', error)
    return false
  }
}

/**
 * Maintenance middleware logic with comprehensive error handling
 */
export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  try {
    // Skip maintenance check for certain paths
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
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
        setTimeout(() => reject(new Error('Maintenance check timeout')), 5000)
      )
    ])
    
    // If not in maintenance mode, continue normally
    if (!isMaintenanceMode) {
      return NextResponse.next()
    }
    
    // Simple admin bypass - check if path is admin related
    if (pathname.startsWith('/admin')) {
      console.log('🔧 Maintenance: Admin route bypassed for', pathname)
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

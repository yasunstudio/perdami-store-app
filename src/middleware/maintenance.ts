import { NextRequest, NextResponse } from 'next/server'
import { isProtectedRoute } from '@/lib/maintenance'

/**
 * Get maintenance status via API call (Edge Runtime compatible)
 */
async function getMaintenanceStatus(): Promise<boolean> {
  try {
    // Determine base URL for API call
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    console.log('🔧 Maintenance: Fetching status from', `${baseUrl}/api/maintenance`)
    
    // Use API endpoint instead of direct database access
    const response = await fetch(`${baseUrl}/api/maintenance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Prevent caching for real-time status
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('🔧 Maintenance: Status received', data)
      return data.isMaintenanceMode ?? false
    }
    
    console.warn('🔧 Maintenance: Failed to fetch maintenance status, defaulting to false', response.status)
    return false
  } catch (error) {
    console.error('🔧 Maintenance: Error fetching maintenance status:', error)
    return false
  }
}

/**
 * Maintenance middleware logic with comprehensive error handling
 */
export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔧 Maintenance: Processing request for', pathname)
  
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
      console.log('🔧 Maintenance: Skipping check for system path', pathname)
      return NextResponse.next()
    }
    
    // Get maintenance status with timeout
    console.log('🔧 Maintenance: Checking maintenance status...')
    const isMaintenanceMode = await Promise.race([
      getMaintenanceStatus(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Maintenance check timeout')), 5000)
      )
    ])
    
    console.log('🔧 Maintenance: Mode status =', isMaintenanceMode, 'for path', pathname)
    
    // If not in maintenance mode, continue normally
    if (!isMaintenanceMode) {
      console.log('🔧 Maintenance: Not in maintenance mode, continuing normally')
      return NextResponse.next()
    }
    
    // Simple admin bypass - check if path is admin related
    if (pathname.startsWith('/admin')) {
      console.log('🔧 Maintenance: Admin route bypassed for', pathname)
      return NextResponse.next()
    }
    
    // Check if route is protected (shopping routes)
    if (isProtectedRoute(pathname)) {
      console.log('🔧 Maintenance: Redirecting protected route', pathname, 'to /maintenance')
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

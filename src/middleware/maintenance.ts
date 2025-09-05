import { NextRequest, NextResponse } from 'next/server'
import { isProtectedRoute } from '@/lib/maintenance'

/**
 * Get maintenance status via API call (Edge Runtime compatible)
 * Fallback to environment variable if API fails
 */
async function getMaintenanceStatus(): Promise<boolean> {
  try {
    // TEMPORARY: For debugging, always return true to test middleware flow
    console.log('🔧 DEBUG: Hardcoded maintenance mode = true')
    return true
    
    // First try environment variable for immediate response
    const envMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
    console.log('🔧 Environment maintenance mode:', envMaintenanceMode)
    
    // For debugging: use hardcoded production URL
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app'
    
    // Use API endpoint instead of direct database access
    const response = await fetch(new URL('/api/maintenance', baseUrl), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('🔧 Maintenance check:', { baseUrl, status: response.status })
    
    if (response.ok) {
      const data = await response.json()
      console.log('🔧 Maintenance status:', data)
      return data.isMaintenanceMode ?? envMaintenanceMode
    }
    
    console.warn('Failed to fetch maintenance status, using environment fallback:', envMaintenanceMode)
    return envMaintenanceMode
  } catch (error) {
    console.error('Error fetching maintenance status:', error)
    // Fallback to environment variable
    const envMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'
    console.log('🔧 Using environment fallback:', envMaintenanceMode)
    return envMaintenanceMode
  }
}

/**
 * Maintenance middleware logic with comprehensive error handling
 */
export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('🔧 Maintenance middleware called for:', pathname)
  
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
      console.log('🔧 Skipping maintenance check for:', pathname)
      return NextResponse.next()
    }
    
    // Get maintenance status with timeout
    console.log('🔧 Checking maintenance status...')
    const isMaintenanceMode = await Promise.race([
      getMaintenanceStatus(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Maintenance check timeout')), 5000)
      )
    ])
    
    console.log('🔧 Maintenance mode result:', isMaintenanceMode)
    
    // If not in maintenance mode, continue normally
    if (!isMaintenanceMode) {
      console.log('🔧 Not in maintenance mode, continuing...')
      return NextResponse.next()
    }
    
    // Simple admin bypass - check if path is admin related
    if (pathname.startsWith('/admin')) {
      console.log('🔧 Maintenance: Admin route bypassed for', pathname)
      return NextResponse.next()
    }
    
    // Check if route is protected (shopping routes)
    const isProtected = isProtectedRoute(pathname)
    console.log('🔧 Route protection check:', { pathname, isProtected })
    
    if (isProtected) {
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

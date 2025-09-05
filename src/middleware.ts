import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple maintenance status check without database dependency
 * Uses environment variable as fallback for Edge Runtime compatibility
 */
async function getMaintenanceStatus(): Promise<boolean> {
  try {
    // Try API endpoint for dynamic status
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app'
    const response = await fetch(new URL('/api/maintenance', baseUrl), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Quick timeout for Edge Runtime
      signal: AbortSignal.timeout(3000)
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.isMaintenanceMode ?? false
    }
  } catch (error) {
    console.warn('Maintenance API call failed, using fallback:', error)
  }
  
  // Fallback to environment variable
  return process.env.MAINTENANCE_MODE === 'true'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for system routes
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icons') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/screenshots')) {
    return NextResponse.next()
  }

  // Allow maintenance page itself
  if (pathname === '/maintenance' || pathname.startsWith('/maintenance/')) {
    return NextResponse.next()
  }

  // Allow admin routes (bypass maintenance)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Check maintenance mode
  const isMaintenanceMode = await getMaintenanceStatus()
  
  if (isMaintenanceMode) {
    // Redirect all other routes to maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // If not in maintenance mode, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|screenshots).*)',
  ],
}

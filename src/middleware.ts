import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { maintenanceMiddleware } from './middleware/maintenance'

// Define protected routes
const protectedRoutes = ['/admin', '/profile', '/orders', '/cart', '/checkout']
const authRoutes = ['/auth/login', '/auth/register']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // First, check maintenance mode (highest priority)
  const maintenanceResponse = await maintenanceMiddleware(request)
  if (maintenanceResponse.status === 302) {
    return maintenanceResponse
  }
  
  // Continue with auth logic for protected routes
  console.log('🔍 Middleware processing:', pathname)
  
  try {
    // Get session for auth-protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const session = await auth()
      
      // Check if user is trying to access admin routes
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
          console.log('🚫 Unauthorized admin access attempt:', pathname)
          return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + encodeURIComponent(pathname), request.url))
        }
      }
      
      // For non-admin protected routes, just check if user is logged in
      else if (!session?.user) {
        console.log('🔒 Redirecting to login for protected route:', pathname)
        return NextResponse.redirect(new URL('/auth/login?callbackUrl=' + encodeURIComponent(pathname), request.url))
      }
    }

    // Redirect logged-in users away from auth pages
    if (authRoutes.some(route => pathname.startsWith(route))) {
      const session = await auth()
      if (session?.user) {
        console.log('🔄 Redirecting logged-in user away from auth page:', pathname)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    // On auth errors, allow access but log the issue
  }
  
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

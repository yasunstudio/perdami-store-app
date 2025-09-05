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
  
  // Continue with existing auth logic
  console.log('🔍 Middleware processing:', pathname)
  
  // For now, allow all requests to pass through
  // TODO: Re-enable auth middleware after maintenance is tested
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

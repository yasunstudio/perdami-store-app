import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Define protected routes
const protectedRoutes = ['/admin', '/profile', '/orders', '/cart', '/checkout']
const authRoutes = ['/auth/login', '/auth/register']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 MIDDLEWARE DISABLED FOR DEBUGGING:', pathname)
  
  // Temporarily allow all requests to pass through
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

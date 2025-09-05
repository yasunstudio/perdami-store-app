import { NextRequest, NextResponse } from 'next/server'

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

  // Allow admin routes
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow maintenance page itself
  if (pathname === '/maintenance' || pathname.startsWith('/maintenance/')) {
    return NextResponse.next()
  }

  // Redirect everything else to maintenance
  return NextResponse.redirect(new URL('/maintenance', request.url))
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

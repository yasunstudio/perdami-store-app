// Route patterns for maintenance mode protection
export const MAINTENANCE_PROTECTED_ROUTES = [
  // Homepage and main entry points
  '/',
  '/home',
  
  // Product browsing
  '/bundles',
  '/stores',
  
  // Shopping cart and checkout
  '/cart',
  '/checkout',
  
  // User account areas (non-admin)
  '/profile',
  '/orders',
  '/notifications',
  '/pickup',
  
  // Authentication and user flows (block during maintenance)
  '/auth/login',
  '/auth/register', 
  '/quick-login',
  
  // Additional shopping-related routes
  '/search',
  '/categories'
] as const

// Routes that should always be accessible during maintenance
export const MAINTENANCE_ALLOWED_ROUTES = [
  // Admin routes (always accessible)
  '/admin',
  
  // System routes
  '/maintenance',
  '/api',
  
  // Static content and assets
  '/_next',
  '/favicon.ico',
  '/icons',
  '/images',
  '/screenshots',
  
  // Legal/informational pages (keep accessible)
  '/privacy',
  '/terms',
  '/about',
  '/contact'
] as const

/**
 * Check if a route should be protected during maintenance
 * Returns true if the route should be blocked for non-admin users
 */
export function isMaintenanceProtectedRoute(pathname: string): boolean {
  // First check if it's explicitly allowed
  const isAllowed = MAINTENANCE_ALLOWED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route)
  )
  
  if (isAllowed) {
    return false
  }
  
  // Check if it's explicitly protected
  const isProtected = MAINTENANCE_PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  if (isProtected) {
    return true
  }
  
  // Default: protect all routes during maintenance except explicitly allowed ones
  // This ensures any new routes are automatically protected
  return true
}

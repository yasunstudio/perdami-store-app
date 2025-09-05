// Protected routes (shopping only) - admin routes are always allowed
export const PROTECTED_ROUTES = [
  '/',           // Homepage
  '/bundles',    // Product listing
  '/cart',       // Shopping cart
  '/checkout',   // Checkout process
  '/orders',     // User orders (non-admin)
  '/profile',    // User profile
  '/stores',     // Store browsing
]

// Admin routes that are always allowed
export const ADMIN_ROUTES = [
  '/admin',      // All admin routes
  '/auth',       // Auth routes
]

// API routes that need special handling
export const API_ROUTES = [
  '/api',        // API routes
]

// Default maintenance message
export const DEFAULT_MAINTENANCE_MESSAGE = `
🔧 Sistem sedang dalam pemeliharaan

Mohon maaf, aplikasi Perdami Store sedang dalam tahap pemeliharaan untuk meningkatkan layanan. 
Silakan coba lagi dalam beberapa saat.

Untuk informasi lebih lanjut, hubungi tim organizer event.
`

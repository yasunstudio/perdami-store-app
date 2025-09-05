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
🔧 Order Tutup Sementara - Dibuka Besok Pagi

Mohon maaf, sistem pemesanan Perdami Store ditutup sementara untuk persiapan event.

📅 Order akan dibuka kembali: BESOK PAGI
⏰ Estimasi waktu: Sekitar pukul 08:00 WIB

Kami sedang mempersiapkan segala sesuatu agar proses pemesanan berjalan lancar di hari event.

Terima kasih atas kesabaran Anda! 🙏
`

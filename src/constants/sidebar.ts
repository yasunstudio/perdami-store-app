/**
 * Konstanta konfigurasi untuk sidebar component
 * Menghindari magic numbers dan memudahkan maintenance
 */
export const SIDEBAR_CONFIG = {
  // Animasi
  HOVER_DELAY: 100,
} as const;

/**
 * Type untuk sidebar configuration
 */
export type SidebarConfig = typeof SIDEBAR_CONFIG;
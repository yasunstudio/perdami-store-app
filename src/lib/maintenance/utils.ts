import { prisma } from '@/lib/prisma'
import { PROTECTED_ROUTES, ADMIN_ROUTES, DEFAULT_MAINTENANCE_MESSAGE } from './constants'
import type { MaintenanceSettings } from './types'

/**
 * Check if user is admin based on session
 */
export const isAdminUser = (session: any): boolean => {
  return session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
}

/**
 * Check if route is protected (shopping routes only)
 */
export const isProtectedRoute = (pathname: string): boolean => {
  // Admin routes are never protected
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return false
  }
  
  // Check if it's a protected route
  return PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Get maintenance settings from database
 */
export const getMaintenanceSettings = async (): Promise<MaintenanceSettings | null> => {
  try {
    const settings = await prisma.appSettings.findFirst()
    return settings as MaintenanceSettings | null
  } catch (error) {
    console.error('Error fetching maintenance settings:', error)
    return null
  }
}

/**
 * Get maintenance status (simplified)
 */
export const getMaintenanceStatus = async (): Promise<boolean> => {
  try {
    const settings = await getMaintenanceSettings()
    return settings?.isMaintenanceMode ?? false
  } catch (error) {
    console.error('Error checking maintenance status:', error)
    return false
  }
}

/**
 * Get maintenance message
 */
export const getMaintenanceMessage = async (): Promise<string> => {
  try {
    const settings = await getMaintenanceSettings()
    return settings?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE
  } catch (error) {
    console.error('Error getting maintenance message:', error)
    return DEFAULT_MAINTENANCE_MESSAGE
  }
}

// Role definitions for the admin system
export const ROLES = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Permissions for different actions
export const PERMISSIONS = {
  // Bundle Management
  BUNDLES_READ: 'bundles:read',
  BUNDLES_CREATE: 'bundles:create',
  BUNDLES_UPDATE: 'bundles:update',
  BUNDLES_DELETE: 'bundles:delete',
  BUNDLES_BULK: 'bundles:bulk',
  
  // Store Management
  STORES_READ: 'stores:read',
  STORES_CREATE: 'stores:create',
  STORES_UPDATE: 'stores:update',
  STORES_DELETE: 'stores:delete',
  
  // User Management
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Order Management
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  
  // Analytics & Reports
  ANALYTICS_READ: 'analytics:read',
  REPORTS_READ: 'reports:read',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  
  // Audit Logs
  AUDIT_LOGS_READ: 'audit_logs:read',
  
  // System Admin
  SYSTEM_ADMIN: 'system:admin'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [
    PERMISSIONS.BUNDLES_READ,
    PERMISSIONS.BUNDLES_CREATE,
    PERMISSIONS.BUNDLES_UPDATE,
    PERMISSIONS.BUNDLES_DELETE,
    PERMISSIONS.BUNDLES_BULK,
    PERMISSIONS.STORES_READ,
    PERMISSIONS.STORES_CREATE,
    PERMISSIONS.STORES_UPDATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.AUDIT_LOGS_READ,
  ],
  
  [ROLES.CUSTOMER]: [
    // Customers have no admin permissions
  ]
}

// Helper function to check if a role has a specific permission
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// Helper function to check if a role has any of the specified permissions
export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.some(permission => hasPermission(role, permission))
}

// Helper function to check if a role has all of the specified permissions
export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.every(permission => hasPermission(role, permission))
}

// Helper function to get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Helper function to check if a role can access admin panel
export function canAccessAdmin(role: Role | undefined): boolean {
  return hasAnyPermission(role, [
    PERMISSIONS.BUNDLES_READ,
    PERMISSIONS.STORES_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.SETTINGS_READ
  ])
}

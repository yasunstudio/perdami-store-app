'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { hasPermission, hasAnyPermission, Permission, Role } from '@/lib/permissions'

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
  role?: Role
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  role
}: PermissionGuardProps) {
  const { data: session } = useSession()
  
  // Use provided role or get from session
  const userRole = role || (session?.user as any)?.role as Role
  
  // Check single permission
  if (permission) {
    if (!hasPermission(userRole, permission)) {
      return <>{fallback}</>
    }
  }
  
  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? permissions.every(p => hasPermission(userRole, p))
      : hasAnyPermission(userRole, permissions)
      
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }
  
  return <>{children}</>
}

// Hook for checking permissions in components
export function usePermissions() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as Role
  
  return {
    userRole,
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => 
      permissions.every(p => hasPermission(userRole, p))
  }
}

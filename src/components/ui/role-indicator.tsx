import { Badge } from '@/components/ui/badge'
import { Shield, User, Briefcase } from 'lucide-react'

interface RoleIndicatorProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function RoleIndicator({ role, size = 'md', showIcon = true }: RoleIndicatorProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrator',
          variant: 'destructive' as const,
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        }
      case 'STAFF':
        return {
          label: 'Staff',
          variant: 'secondary' as const,
          icon: Briefcase,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        }
      case 'CUSTOMER':
        return {
          label: 'Customer',
          variant: 'outline' as const,
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        }
      default:
        return {
          label: role,
          variant: 'outline' as const,
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        }
    }
  }

  const config = getRoleConfig(role)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}

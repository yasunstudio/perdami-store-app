'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  LogOut, 
  Settings, 
  ShoppingBag, 
  Shield,
  Loader2,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface MobileUserMenuProps {
  onClose: () => void
}

export function MobileUserMenu({ onClose }: MobileUserMenuProps) {
  const { data: session, status } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Masuk untuk pengalaman belanja yang lebih baik
        </p>
        <div className="space-y-2">
          <Button className="w-full" asChild onClick={onClose}>
            <Link href="/auth/register">
              Daftar Sekarang
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild onClick={onClose}>
            <Link href="/auth/login">
              Sudah Punya Akun? Masuk
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const userInitials = session.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  const isAdmin = session.user?.role === 'ADMIN'
  const isStaff = session.user?.role === 'STAFF'

  // Base menu items available to all users
  const baseMenuItems = [
    {
      icon: User,
      label: 'Profil Saya',
      href: '/profile'
    },
    {
      icon: ShoppingBag,
      label: 'Pesanan Saya',
      href: '/orders'
    }
  ]

  // Add settings option only for admin or staff users
  const menuItems = isAdmin || isStaff
    ? [
        ...baseMenuItems,
        {
          icon: Settings,
          label: 'Pengaturan',
          href: '/settings'
        }
      ]
    : baseMenuItems;

  if (isAdmin) {
    menuItems.push({
      icon: Shield,
      label: 'Dashboard Admin',
      href: '/admin'
    })
  }

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
      {/* User Info Card */}
      <div className="flex items-center space-x-3 p-4 bg-background rounded-lg border">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold truncate">
              {session.user?.name || 'User'}
            </p>
            {isAdmin && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {session.user?.email}
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center justify-between p-3 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>{label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      {/* Sign Out Button */}
      <Button
        variant="outline"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 h-4 w-4" />
        )}
        Keluar
      </Button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, ShoppingCart, Package, Bell, Loader2, UserPlus } from 'lucide-react'

interface MobileUserMenuProps {
  onClose?: () => void
}

export function MobileUserMenu({ onClose }: MobileUserMenuProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col space-y-2">
          <Button variant="default" size="sm" className="w-full" asChild>
            <a href="/auth/login" onClick={onClose}>
              <User className="mr-2 h-4 w-4" />
              Masuk
            </a>
          </Button>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="/auth/register" onClick={onClose}>
              <UserPlus className="mr-2 h-4 w-4" />
              Daftar
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ redirect: false })
      router.push('/')
      onClose?.()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    onClose?.()
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
    : session.user.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {session.user.name || 'Pengguna'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {session.user.email}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3"
          onClick={() => handleNavigation('/profile')}
        >
          <User className="mr-3 h-4 w-4 text-blue-500" />
          <span className="flex-1 text-left">Profil Saya</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3"
          onClick={() => handleNavigation('/orders')}
        >
          <Package className="mr-3 h-4 w-4 text-green-500" />
          <span className="flex-1 text-left">Pesanan Saya</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3"
          onClick={() => handleNavigation('/cart')}
        >
          <ShoppingCart className="mr-3 h-4 w-4 text-orange-500" />
          <span className="flex-1 text-left">Keranjang</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3"
          onClick={() => handleNavigation('/notifications')}
        >
          <Bell className="mr-3 h-4 w-4 text-purple-500" />
          <span className="flex-1 text-left">Notifikasi</span>
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3"
          onClick={() => handleNavigation('/settings')}
        >
          <Settings className="mr-3 h-4 w-4 text-gray-500" />
          <span className="flex-1 text-left">Pengaturan</span>
        </Button>
      </div>

      {/* Logout Button */}
      <div className="pt-2 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {isLoading ? 'Keluar...' : 'Keluar'}
          </span>
        </Button>
      </div>
    </div>
  )
}

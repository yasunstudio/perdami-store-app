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
import { User, Settings, LogOut, ShoppingCart, Package, Bell } from 'lucide-react'

export function MobileUserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
    : session.user.email?.[0]?.toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/orders')}>
          <Package className="mr-2 h-4 w-4" />
          <span>Pesanan</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/cart')}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          <span>Keranjang</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/notifications')}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifikasi</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Pengaturan</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Keluar...' : 'Keluar'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

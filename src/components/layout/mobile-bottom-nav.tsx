'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Package, 
  Store, 
  ShoppingCart, 
  User,
  Receipt
} from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useSession } from 'next-auth/react'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
  requiresAuth?: boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const cart = useCartStore((state) => state.cart)
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Auto-hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const navItems: NavItem[] = [
    {
      href: '/',
      icon: Home,
      label: 'Beranda'
    },
    {
      href: '/bundles',
      icon: Package,
      label: 'Paket'
    },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: 'Keranjang',
      badge: cart.itemCount
    },
    {
      href: '/orders',
      icon: Receipt,
      label: 'Pesanan',
      requiresAuth: true
    },
    {
      href: session ? '/profile' : '/auth/login',
      icon: User,
      label: session ? 'Profil' : 'Masuk',
      requiresAuth: false
    }
  ]

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname?.startsWith(href)) return true
    return false
  }

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 transition-transform duration-300 md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <nav className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map(({ href, icon: Icon, label, badge, requiresAuth }) => {
          const active = isActive(href)
          
          // For auth-required items, redirect to login if not authenticated
          const finalHref = requiresAuth && !session ? '/auth/login' : href
          
          return (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 h-14 p-2 rounded-xl transition-all duration-200 hover:bg-primary/5",
                active 
                  ? "text-primary bg-primary/10 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={finalHref}>
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      active ? "scale-110" : "scale-100"
                    )} 
                  />
                  {badge && badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground border border-background">
                      {badge > 9 ? '9+' : badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}

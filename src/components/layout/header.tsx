'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ShoppingCart, Package, Store, Grid3X3, Menu, Sun, Moon } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { UserMenu, MobileUserMenu } from '@/features/auth/components'
import { formatPrice } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { NotificationBell } from '@/components/shared/notification-bell'
import { useAppSettings } from '@/hooks/use-app-settings'

export function Header() {
  const cart = useCartStore((state) => state.cart)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { settings } = useAppSettings()

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigationLinks = [
    { href: '/', icon: Grid3X3, label: 'Beranda' },
    { href: '/bundles', icon: Package, label: 'Paket' },
    { href: '/stores', icon: Store, label: 'Toko' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-900/95 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-shrink-0 flex-1">
            <Link href="/" className="flex items-center space-x-3 group" prefetch={true}>
              <Package className="h-7 w-7 text-primary group-hover:scale-105 transition-transform duration-200" />
              <span className="hidden font-bold text-xl sm:inline-block group-hover:text-primary transition-colors duration-200">
                {settings?.appName || 'Dharma Wanita Perdami'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <nav className="flex items-center space-x-6 lg:space-x-8 text-sm font-medium whitespace-nowrap">
              {navigationLinks.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200 font-medium whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop Actions - Right */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
            {/* Theme Toggle - Admin Style */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] text-blue-600" />
                )}
              </Button>
            )}
            
            {/* Notification Bell */}
            <NotificationBell className="hover:bg-gray-100 dark:hover:bg-gray-800" />
            
            <Button variant="ghost" size="sm" asChild className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cart.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cart.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <UserMenu />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle - Mobile Admin Style */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] text-blue-600" />
                )}
              </Button>
            )}
            {/* Mobile Cart */}
            <Button variant="ghost" size="sm" asChild className="relative hover:bg-gray-100 dark:hover:bg-gray-800">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cart.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cart.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0 flex flex-col">
                {/* Header dengan gradient */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b flex-shrink-0">
                  <SheetHeader>
                    <div className="flex items-center space-x-3">
                      <Package className="h-6 w-6 text-primary" />
                      <SheetTitle className="text-lg font-bold">{settings?.appName || 'Dharma Wanita Perdami'}</SheetTitle>
                    </div>
                  </SheetHeader>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Navigation Links */}
                  <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
                    {navigationLinks.map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-4 px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">{label}</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Cart Summary untuk Mobile - Fixed */}
                  <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0 space-y-3">
                    {/* Cart Summary */}
                    <Link
                      href="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border hover:border-primary/20 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          {cart.itemCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs">
                              {cart.itemCount}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Keranjang Belanja</p>
                          <p className="text-xs text-muted-foreground">
                            {cart.itemCount > 0 ? `${cart.itemCount} item` : 'Kosong'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {cart.total > 0 && (
                          <p className="text-sm font-bold text-primary">
                            {formatPrice(cart.total)}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* User Section - Fixed */}
                  <div className="px-6 py-4 border-t flex-shrink-0">
                    <MobileUserMenu onClose={() => setMobileMenuOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

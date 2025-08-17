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
          <div className="flex md:hidden items-center space-x-1">
            {/* Theme Toggle - Mobile */}
            {mounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-600" />
                )}
              </Button>
            )}
            
            {/* Notification Bell - Mobile */}
            <NotificationBell className="hover:bg-gray-100 dark:hover:bg-gray-800 h-10 w-10" />
            
            {/* Mobile Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className="relative h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cart.itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground border-2 border-background">
                    {cart.itemCount > 9 ? '9+' : cart.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0 flex flex-col">
                {/* Header dengan gradient yang lebih profesional */}
                <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-6 border-b backdrop-blur-sm flex-shrink-0">
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <SheetTitle className="text-lg font-bold text-left">
                            {settings?.appName || 'Dharma Wanita Perdami'}
                          </SheetTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Selamat datang di toko online kami
                          </p>
                        </div>
                      </div>
                    </div>
                  </SheetHeader>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Navigation Links */}
                  <nav className="px-6 py-6 space-y-3 border-b">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Menu Navigasi
                    </h3>
                    {navigationLinks.map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-4 px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 group border border-transparent hover:border-primary/10"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-200">
                          <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                        </div>
                        <span className="group-hover:translate-x-1 transition-transform duration-200 font-medium">
                          {label}
                        </span>
                      </Link>
                    ))}
                  </nav>

                  {/* Cart Summary - Improved */}
                  <div className="px-6 py-6 border-b bg-muted/20">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Keranjang Belanja
                    </h3>
                    <Link
                      href="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-4 bg-background rounded-xl border hover:border-primary/20 transition-all duration-200 group hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                            <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200" />
                          </div>
                          {cart.itemCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                              {cart.itemCount}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Keranjang Belanja</p>
                          <p className="text-xs text-muted-foreground">
                            {cart.itemCount > 0 ? `${cart.itemCount} item tersimpan` : 'Belum ada item'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {cart.total > 0 && (
                          <div>
                            <p className="text-sm font-bold text-primary">
                              {formatPrice(cart.total)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* User Section - Enhanced */}
                  <div className="px-6 py-6 flex-shrink-0 bg-muted/10">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Akun Pengguna
                    </h3>
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

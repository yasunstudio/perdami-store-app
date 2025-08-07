'use client'

import { useAppSettings } from "@/hooks/use-app-settings"

export function StoresPageHeader() {
  const { settings, isLoading } = useAppSettings()
  
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        Semua Toko
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Jelajahi berbagai toko yang menyediakan oleh-oleh khas Bandung terbaik untuk acara {isLoading ? 'Loading...' : settings?.eventName || 'PIT PERDAMI 2025'}
      </p>
    </div>
  )
}

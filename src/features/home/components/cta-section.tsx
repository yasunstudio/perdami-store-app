'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Package } from "lucide-react"
import { useAppSettings } from "@/hooks/use-app-settings"

export function CTASection() {
  const { settings, isLoading } = useAppSettings()

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 p-4 bg-primary/10 rounded-full w-fit">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
              Siap Berbelanja Oleh-oleh?
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Jangan sampai kehabisan! Pre-order sekarang dan dapatkan oleh-oleh khas Bandung 
              terbaik untuk dibawa pulang dari {isLoading ? 'Loading...' : settings?.eventName || 'PIT PERDAMI 2025'}.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center pb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button size="lg" asChild className="flex-1">
                <Link href="/stores">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Mulai Belanja
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="flex-1">
                <Link href="/bundles">
                  Lihat Paket
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              * Pesanan dapat diambil di {isLoading ? 'Loading...' : settings?.pickupLocation || 'venue PIT PERDAMI 2025'} hari ke-3
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Shield, Star } from "lucide-react"
import { useAppSettings } from "@/hooks/use-app-settings"

export function FeaturesSection() {
  const { settings, isLoading } = useAppSettings()
  
  const features = [
    {
      icon: Package,
      title: "Pre-Order Mudah",
      description: "Pesan oleh-oleh favorit Anda jauh-jauh hari sebelum acara dimulai"
    },
    {
      icon: Clock,
      title: "Pickup di Venue",
      description: `Ambil pesanan langsung di ${isLoading ? 'venue event' : settings?.pickupLocation || 'venue PIT PERDAMI 2025'}`
    },
    {
      icon: Shield,
      title: "Terjamin Kualitas",
      description: "Produk berkualitas dari toko-toko terpercaya di Bandung"
    },
    {
      icon: Star,
      title: "Harga Terbaik",
      description: `Dapatkan harga khusus untuk peserta ${isLoading ? 'event' : settings?.eventName || 'PIT PERDAMI 2025'}`
    }
  ]

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Kenapa {isLoading ? 'Perdami Store' : settings?.appName || 'Perdami Store'}?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Belanja Oleh-oleh Jadi Lebih Mudah
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nikmati pengalaman berbelanja yang praktis dan aman dengan berbagai keunggulan kami
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

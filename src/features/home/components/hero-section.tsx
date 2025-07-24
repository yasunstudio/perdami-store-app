import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative py-8 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6">
          <Badge variant="secondary" className="text-sm">
            PIT PERDAMI 2025 - Bandung
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Oleh-oleh Khas{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Bandung
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Platform pre-order eksklusif untuk peserta PIT PERDAMI 2025. 
            Pilih paket oleh-oleh yang sudah dikurasi khusus, ambil langsung di venue event.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="px-8">
              <Link href="/bundles">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Pilih Paket Oleh-oleh
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-8">
              <Link href="/stores">
                <Users className="mr-2 h-5 w-5" />
                Lihat Toko
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

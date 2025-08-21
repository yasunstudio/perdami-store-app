import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, Store } from 'lucide-react'
import { type StoreWithCounts as StoreType } from '@/types'

interface StoreCardProps {
  store: StoreType
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {store.image ? (
            <Image 
              src={store.image} 
              alt={store.name}
              width={400}
              height={400}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Store className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-muted-foreground text-sm">Foto Toko</span>
            </div>
          )}
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
              {store.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {store.description || 'Toko oleh-oleh khas Bandung'}
            </CardDescription>
          </div>
          <Badge variant={store.isActive ? 'default' : 'secondary'} className="ml-2">
            {store.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            Venue PIT PERDAMI 2025, Bandung
          </div>

          {/* Bundles info */}
          <div className="flex items-center text-sm">
            <Package className="h-4 w-4 mr-2 text-primary" />
            <span className="text-muted-foreground">
              {store.bundleCount ? `${store.bundleCount} paket tersedia` : 'Belum ada paket'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/bundles?store=${store.id}`}>
                Lihat Paket
              </Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link href={`/stores/${store.id}`}>
                Detail Toko
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Package2, Edit, ArrowLeft, Users, Star, Eye, EyeOff, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import type { ProductBundleWithRelations } from '../types/bundle.types'

interface BundleDetailPageProps {
  bundleId: string
}

export function BundleDetailPage({ bundleId }: BundleDetailPageProps) {
  const router = useRouter()
  const [bundle, setBundle] = useState<ProductBundleWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBundleData()
  }, [bundleId])

  const loadBundleData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Bundle tidak ditemukan')
        }
        throw new Error('Gagal memuat data bundle')
      }

      const data = await response.json()
      setBundle(data.bundle)
    } catch (error) {
      console.error('Error loading bundle:', error)
      setError(error instanceof Error ? error.message : 'Gagal memuat data bundle')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminPageLayout title="Memuat Detail Bundle">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat detail bundle...</span>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  if (error || !bundle) {
    return (
      <AdminPageLayout title="Error">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error || 'Bundle tidak ditemukan'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bundle yang Anda cari tidak dapat ditemukan atau terjadi kesalahan
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.push('/admin/bundles')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Bundle
              </Button>
              <Button onClick={loadBundleData}>
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout 
      title={`Detail Bundle: ${bundle.name}`}
      description="Lihat informasi lengkap bundle produk"
      showBackButton={true}
      backUrl="/admin/bundles"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={bundle.isActive ? 'default' : 'secondary'}>
              {bundle.isActive ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
            {bundle.isFeatured && (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3" />
                Featured
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              {bundle.showToCustomer ? (
                <>
                  <Eye className="h-3 w-3" />
                  Terlihat Customer
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  Tersembunyi
                </>
              )}
            </Badge>
          </div>
          <Button onClick={() => router.push(`/admin/bundles/${bundle.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Bundle
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Informasi Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{bundle.name}</h3>
                  {bundle.description && (
                    <p className="text-muted-foreground mt-2">{bundle.description}</p>
                  )}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Harga Jual</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(bundle.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Harga Modal</p>
                    <p className="text-xl font-bold text-orange-600">{formatPrice(bundle.costPrice)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Margin Profit</p>
                    <p className="text-lg font-bold text-green-600">
                      {bundle.costPrice > 0 ? 
                        `${(((bundle.sellingPrice - bundle.costPrice) / bundle.costPrice) * 100).toFixed(1)}%` 
                        : '0%'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Jumlah Item</p>
                    <p className="text-lg font-bold">{bundle.contents?.length || 0}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toko</p>
                  <p className="font-medium">{bundle.store?.name || 'Tidak diketahui'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Bundle Contents */}
            <Card>
              <CardHeader>
                <CardTitle>Isi Bundle</CardTitle>
              </CardHeader>
              <CardContent>
                {bundle.contents && Array.isArray(bundle.contents) && bundle.contents.length > 0 ? (
                  <div className="space-y-3">
                    {bundle.contents.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity} {item.unit || 'pcs'}</p>
                          {item.price > 0 && (
                            <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Belum ada item dalam bundle ini</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bundle Image */}
            <Card>
              <CardHeader>
                <CardTitle>Gambar Bundle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square">
                  <img
                    src={bundle.image || '/images/products/placeholder.jpg'}
                    alt={bundle.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status Bundle</span>
                  <Badge variant={bundle.isActive ? 'default' : 'secondary'}>
                    {bundle.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Featured</span>
                  <Badge variant={bundle.isFeatured ? 'default' : 'outline'}>
                    {bundle.isFeatured ? 'Ya' : 'Tidak'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Terlihat Customer</span>
                  <Badge variant={bundle.showToCustomer ? 'default' : 'secondary'}>
                    {bundle.showToCustomer ? 'Ya' : 'Tidak'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Dibuat pada</p>
                  <p className="text-sm">
                    {new Date(bundle.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Terakhir diperbarui</p>
                  <p className="text-sm">
                    {new Date(bundle.updatedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  )
}

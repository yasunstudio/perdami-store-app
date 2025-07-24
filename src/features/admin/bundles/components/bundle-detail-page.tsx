'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Star, Calendar, DollarSign, Tag, ShoppingBag, Eye, Edit, ArrowLeft, Loader2, BarChart3 } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
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
      const response = await fetch(`/api/admin/bundles/${bundleId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Paket produk tidak ditemukan')
          toast.error('Paket produk tidak ditemukan')
        } else if (response.status === 401) {
          setError('Akses tidak diizinkan')
          toast.error('Akses tidak diizinkan')
        } else {
          setError('Gagal memuat data paket produk')
          toast.error('Gagal memuat data paket produk')
        }
        return
      }

      const data = await response.json()
      if (data.bundle) {
        setBundle(data.bundle)
      } else {
        setError('Data paket produk tidak valid')
        toast.error('Data paket produk tidak valid')
      }
    } catch (error) {
      console.error('Error loading bundle:', error)
      setError('Terjadi kesalahan saat memuat data')
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    router.push(`/admin/bundles/${bundleId}/edit`)
  }

  const actions = (
    <Button onClick={handleEdit} size="sm" className="h-8">
      <Edit className="h-4 w-4 mr-1" />
      Edit Paket
    </Button>
  )

  if (loading) {
    return (
      <AdminPageLayout title="Memuat Detail Paket">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Memuat detail paket produk...</span>
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error || 'Paket produk tidak ditemukan'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Terjadi masalah saat memuat detail paket produk
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.push('/admin/bundles')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Paket
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
      title="Detail Paket Produk"
      description="Informasi lengkap tentang paket produk"
      showBackButton={true}
      backUrl="/admin/bundles"
      actions={actions}
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nama Paket</label>
                  <p className="text-sm font-medium">{bundle.name}</p>
                </div>
                
                {bundle.description && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                    <p className="text-sm">{bundle.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Harga</label>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(bundle.price)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Items</label>
                    <p className="text-sm font-medium">{Array.isArray(bundle.contents) ? bundle.contents.length : 0} items</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Toko</label>
                  <p className="text-sm font-medium">{bundle.store.name}</p>
                  {bundle.store.city && (
                    <p className="text-xs text-muted-foreground">📍 {bundle.store.city}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bundle Contents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Isi Paket ({Array.isArray(bundle.contents) ? bundle.contents.length : 0} item)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!bundle.contents || !Array.isArray(bundle.contents) || bundle.contents.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Belum ada item dalam paket ini</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bundle.contents.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-lg">Item {index + 1}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.quantity}x
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Nama Item</label>
                            <p className="text-sm font-medium">{item.name}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground">Kuantitas</label>
                            <p className="text-sm">{item.quantity} buah</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bundle Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gambar Paket</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gambar yang mewakili paket produk
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square">
                  {bundle.image ? (
                    <img
                      src={bundle.image}
                      alt={bundle.name}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg border flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Status & Pengaturan
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status dan pengaturan paket produk
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Status Aktif</span>
                    <p className="text-xs text-muted-foreground">
                      {bundle.isActive ? 'Paket dapat dilihat di toko' : 'Paket tidak aktif'}
                    </p>
                  </div>
                  <Badge variant={bundle.isActive ? "default" : "secondary"}>
                    {bundle.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Unggulan</span>
                    <p className="text-xs text-muted-foreground">
                      {bundle.isFeatured ? 'Tampil di halaman utama' : 'Tidak unggulan'}
                    </p>
                  </div>
                  <Badge variant={bundle.isFeatured ? "default" : "outline"}>
                    {bundle.isFeatured ? (
                      <><Star className="h-3 w-3 mr-1" />Ya</>
                    ) : (
                      "Tidak"
                    )}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="text-sm font-medium">Tampil ke Pelanggan</span>
                    <p className="text-xs text-muted-foreground">
                      {bundle.showToCustomer ? 'Pelanggan dapat melihat' : 'Tidak tampil ke pelanggan'}
                    </p>
                  </div>
                  <Badge variant={bundle.showToCustomer ? "default" : "outline"}>
                    {bundle.showToCustomer ? (
                      <><Eye className="h-3 w-3 mr-1" />Ya</>
                    ) : (
                      "Tidak"
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Pesanan</span>
                  <span className="text-sm font-medium">{bundle._count?.orderItems || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Informasi Waktu
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Riwayat waktu pembuatan dan pembaruan
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                  <p className="text-sm">{formatDate(bundle.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Diperbarui</label>
                  <p className="text-sm">{formatDate(bundle.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

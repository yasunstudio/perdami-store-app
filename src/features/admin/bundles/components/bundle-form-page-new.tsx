'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ProductBundle } from '@prisma/client'
import { BundleImageUpload } from './bundle-image-upload'
import { BundleItemsManager } from './bundle-items-manager'
import type { BundleContentItemWithId, BundleFormData } from '../types/bundle.types'

interface Store {
  id: string
  name: string
  description?: string | null
}

interface BundleFormPageNewProps {
  mode?: 'create' | 'edit'
  bundleId?: string
  initialData?: ProductBundle
}

export function BundleFormPageNew({ mode = 'create', bundleId, initialData }: BundleFormPageNewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [bundle, setBundle] = useState<ProductBundle | null>(initialData || null)
  const [stores, setStores] = useState<Store[]>([])
  const [formData, setFormData] = useState<BundleFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    storeId: initialData?.storeId || '',
    image: initialData?.image || '',
    contents: initialData?.contents ? 
      (initialData.contents as any[]).map((item, index) => ({
        ...item,
        id: `item-${index}`
      })) : [],
    isActive: initialData?.isActive || true,
    isFeatured: initialData?.isFeatured || false,
    showToCustomer: initialData?.showToCustomer || true,
  })

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true)
      try {
        const response = await fetch('/api/admin/stores')
        if (response.ok) {
          const data = await response.json()
          setStores(data.stores || data)
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
        toast.error('Gagal mengambil data toko')
      } finally {
        setIsLoadingStores(false)
      }
    }

    fetchStores()
  }, [])

  // Fetch bundle data if in edit mode and no initial data provided
  useEffect(() => {
    const fetchBundle = async () => {
      if (mode === 'edit' && bundleId && !initialData) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/admin/bundles/${bundleId}`)
          if (response.ok) {
            const bundleData = await response.json()
            console.log('Fetched bundle data:', bundleData) // Debug log
            setBundle(bundleData)
            setFormData({
              name: bundleData.name || '',
              description: bundleData.description || '',
              price: Number(bundleData.price) || 0,
              storeId: bundleData.storeId || '',
              image: bundleData.image || '',
              contents: bundleData.contents ? 
                (Array.isArray(bundleData.contents) ? bundleData.contents : []).map((item: any, index: number) => ({
                  ...item,
                  id: `item-${index}-${Date.now()}`
                })) : [],
              isActive: bundleData.isActive !== undefined ? bundleData.isActive : true,
              isFeatured: bundleData.isFeatured !== undefined ? bundleData.isFeatured : false,
              showToCustomer: bundleData.showToCustomer !== undefined ? bundleData.showToCustomer : true,
            })
          } else {
            const errorData = await response.json()
            console.error('Error response:', errorData)
            toast.error(`Gagal mengambil data bundle: ${errorData.message || 'Unknown error'}`)
            router.push('/admin/bundles')
          }
        } catch (error) {
          console.error('Error fetching bundle:', error)
          toast.error('Gagal mengambil data bundle')
          router.push('/admin/bundles')
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchBundle()
  }, [mode, bundleId, initialData, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Nama bundle harus diisi')
      return
    }
    
    if (!formData.storeId) {
      toast.error('Toko harus dipilih')
      return
    }
    
    if (formData.price <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }

    setIsLoading(true)

    try {
      const url = mode === 'edit' && bundleId 
        ? `/api/admin/bundles/${bundleId}`
        : '/api/admin/bundles'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      // Prepare data to send
      const submitData = {
        ...formData,
        contents: formData.contents?.map(({ id, ...item }) => item) || [], // Remove id from contents
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save bundle')
      }

      toast.success(mode === 'edit' ? 'Bundle berhasil diperbarui' : 'Bundle berhasil dibuat')
      router.push('/admin/bundles')
    } catch (error) {
      console.error('Error saving bundle:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan bundle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof BundleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleItemsChange = (items: BundleContentItemWithId[]) => {
    setFormData(prev => ({
      ...prev,
      contents: items,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/bundles')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Kembali
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Bundle Produk' : 'Tambah Bundle Baru'}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'edit' 
                ? 'Perbarui informasi bundle produk yang sudah ada' 
                : 'Buat bundle produk baru untuk toko Anda'
              }
            </p>
          </div>
        </div>

        {/* Loading State */}
        {mode === 'edit' && bundleId && !bundle && isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <div>
                  <p className="text-lg font-medium text-gray-900">Memuat Data Bundle</p>
                  <p className="text-sm text-gray-500">Mohon tunggu sebentar...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Informasi Dasar</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Atur informasi dasar bundle produk
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nama Bundle <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama bundle yang menarik"
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                        Harga <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        required
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        Harga dalam Rupiah (IDR)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="storeId" className="text-sm font-medium text-gray-700">
                        Toko <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.storeId}
                        onValueChange={(value) => handleInputChange('storeId', value)}
                        disabled={isLoadingStores}
                      >
                        <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder={isLoadingStores ? "Memuat toko..." : "Pilih toko"} />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Deskripsi Bundle
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Jelaskan keunikan dan manfaat bundle ini..."
                      rows={4}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Gambar Bundle</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Upload gambar menarik untuk bundle produk
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <BundleImageUpload
                  value={formData.image}
                  onChange={(url) => handleInputChange('image', url)}
                />
              </CardContent>
            </Card>

            {/* Bundle Contents Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Isi Bundle</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Atur item-item yang termasuk dalam bundle ini
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <BundleItemsManager
                  items={formData.contents || []}
                  onItemsChange={handleItemsChange}
                />
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-white border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Pengaturan Bundle</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Konfigurasi visibilitas dan status bundle
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Status Bundle
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Bundle aktif dapat dipesan pelanggan
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                        Bundle Unggulan
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Tampilkan di halaman utama
                      </p>
                    </div>
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="showToCustomer" className="text-sm font-medium text-gray-700">
                        Tampilkan ke Pelanggan
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Terlihat oleh pelanggan di katalog
                      </p>
                    </div>
                    <Switch
                      id="showToCustomer"
                      checked={formData.showToCustomer}
                      onCheckedChange={(checked) => handleInputChange('showToCustomer', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="text-sm text-gray-500">
                    {mode === 'edit' 
                      ? 'Perubahan akan disimpan dan diterapkan segera' 
                      : 'Bundle baru akan dibuat dan dapat langsung digunakan'
                    }
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/admin/bundles')}
                      disabled={isLoading}
                      className="min-w-[100px]"
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        mode === 'edit' ? 'Perbarui Bundle' : 'Simpan Bundle'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}
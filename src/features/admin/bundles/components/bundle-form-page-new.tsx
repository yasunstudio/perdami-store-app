'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ProductBundle } from '@prisma/client'

interface BundleFormPageNewProps {
  mode?: 'create' | 'edit'
  bundleId?: string
  initialData?: ProductBundle
}

export function BundleFormPageNew({ mode = 'create', bundleId, initialData }: BundleFormPageNewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [bundle, setBundle] = useState<ProductBundle | null>(initialData || null)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    image: initialData?.image || '',
    isActive: initialData?.isActive || true,
  })

  // Fetch bundle data if in edit mode and no initial data provided
  useEffect(() => {
    const fetchBundle = async () => {
      if (mode === 'edit' && bundleId && !initialData) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/admin/bundles/${bundleId}`)
          if (response.ok) {
            const bundleData = await response.json()
            setBundle(bundleData)
            setFormData({
              name: bundleData.name || '',
              description: bundleData.description || '',
              price: bundleData.price || 0,
              image: bundleData.image || '',
              isActive: bundleData.isActive || true,
            })
          } else {
            toast.error('Gagal mengambil data bundle')
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
    setIsLoading(true)

    try {
      const url = mode === 'edit' && bundleId 
        ? `/api/admin/bundles/${bundleId}`
        : '/api/admin/bundles'
      
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save bundle')
      }

      toast.success(mode === 'edit' ? 'Bundle berhasil diperbarui' : 'Bundle berhasil dibuat')
      router.push('/admin/bundles')
    } catch (error) {
      console.error('Error saving bundle:', error)
      toast.error('Gagal menyimpan bundle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'edit' ? 'Edit Bundle' : 'Tambah Bundle Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === 'edit' && bundleId && !bundle && isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Memuat data bundle...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Bundle</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama bundle"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                  placeholder="Masukkan harga"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">URL Gambar</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="Masukkan URL gambar"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Aktif</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Masukkan deskripsi bundle"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/bundles')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

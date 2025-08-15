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
  bundleId?: string
  initialData?: ProductBundle
}

export function BundleFormPageNew({ bundleId, initialData }: BundleFormPageNewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    image: initialData?.image || '',
    isActive: initialData?.isActive || true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = bundleId 
        ? `/api/admin/bundles/${bundleId}`
        : '/api/admin/bundles'
      
      const method = bundleId ? 'PUT' : 'POST'

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

      toast.success(bundleId ? 'Bundle berhasil diperbarui' : 'Bundle berhasil dibuat')
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
            {bundleId ? 'Edit Bundle' : 'Tambah Bundle Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}

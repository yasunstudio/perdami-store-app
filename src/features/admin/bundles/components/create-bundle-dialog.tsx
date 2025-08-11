'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadToCloudinary } from '@/lib/upload'
import Image from 'next/image'

interface CreateBundleDialogProps {
  onBundleCreated?: () => void
  storeId?: string
}

interface BundleFormData {
  name: string
  description: string
  price: number
  storeId: string
  category: string
  image: string
  isActive: boolean
}

export function CreateBundleDialog({ onBundleCreated, storeId }: CreateBundleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  
  const [formData, setFormData] = useState<BundleFormData>({
    name: '',
    description: '',
    price: 0,
    storeId: storeId || '',
    category: '',
    image: '',
    isActive: true
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, {
        folder: 'bundles',
        resourceType: 'image'
      })

      setFormData(prev => ({ ...prev, image: result.url }))
      toast.success('Image uploaded successfully!')
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image. Please try again.')
      setPreviewImage('')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }))
    setPreviewImage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Bundle name is required')
      return
    }
    
    if (!formData.storeId) {
      toast.error('Please select a store')
      return
    }
    
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create bundle')
      }

      const result = await response.json()
      toast.success('Bundle created successfully!')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        storeId: storeId || '',
        category: '',
        image: '',
        isActive: true
      })
      setPreviewImage('')
      setOpen(false)
      
      // Callback to refresh data
      if (onBundleCreated) {
        onBundleCreated()
      }
      
    } catch (error) {
      console.error('Create bundle error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create bundle')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      storeId: storeId || '',
      category: '',
      image: '',
      isActive: true
    })
    setPreviewImage('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          Tambah Paket Produk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Bundle</DialogTitle>
          <DialogDescription>
            Add a new product bundle to your store. Make sure to include an attractive image and detailed description.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bundle Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Bundle Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {previewImage || formData.image ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-md overflow-hidden">
                    <Image
                      src={previewImage || formData.image}
                      alt="Bundle preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90">
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bundle Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Bundle Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Paket Oleh-oleh Lengkap"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what's included in this bundle..."
              rows={3}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (Rp) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1000"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
              placeholder="25000"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="makanan">Makanan</SelectItem>
                <SelectItem value="minuman">Minuman</SelectItem>
                <SelectItem value="kerajinan">Kerajinan</SelectItem>
                <SelectItem value="pakaian">Pakaian</SelectItem>
                <SelectItem value="aksesoris">Aksesoris</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Store Selection (if not pre-selected) */}
          {!storeId && (
            <div className="space-y-2">
              <Label htmlFor="storeId">Store *</Label>
              <Select value={formData.storeId} onValueChange={(value) => setFormData(prev => ({ ...prev, storeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store1">Warung Sunda</SelectItem>
                  <SelectItem value="store2">Toko Bandung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active (visible to customers)</Label>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Bundle'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

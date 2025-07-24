'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Camera, X, Save, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ImageUploadModalProps {
  trigger?: React.ReactNode
}

export function ImageUploadModal({ trigger }: ImageUploadModalProps) {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxFileSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }

    // Validate file size
    if (file.size > maxFileSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Pilih file gambar terlebih dahulu')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal mengupload gambar')
      }

      const data = await response.json()

      // Update session with new image URL
      await update({
        ...session,
        user: {
          ...session?.user,
          image: data.imageUrl
        }
      })

      toast.success('Foto profil berhasil diperbarui')
      setOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Gagal mengupload gambar. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!session?.user?.image) {
      toast.error('Tidak ada foto profil untuk dihapus')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/profile/remove-image', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus foto profil')
      }

      // Update session to remove image
      await update({
        ...session,
        user: {
          ...session?.user,
          image: null
        }
      })

      toast.success('Foto profil berhasil dihapus')
      setOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Error removing image:', error)
      toast.error(error.message || 'Gagal menghapus foto profil. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    setOpen(false)
    resetForm()
  }

  const currentImageUrl = previewUrl || session?.user?.image
  const userName = session?.user?.name || session?.user?.email || 'User'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Foto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kelola Foto Profil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current/Preview Image */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={currentImageUrl || ''} alt={userName} />
              <AvatarFallback className="text-2xl">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {previewUrl && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Preview foto baru</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ukuran: {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Camera className="h-4 w-4 mr-2" />
              Pilih Foto Baru
            </Button>
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Format yang didukung: JPG, PNG, WebP</p>
              <p>Ukuran maksimal: 5MB</p>
              <p>Rekomendasi: 400x400 piksel atau lebih</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Mengupload...' : 'Upload Foto'}
              </Button>
            )}
            
            {session?.user?.image && !selectedFile && (
              <Button
                variant="destructive"
                onClick={handleRemoveImage}
                disabled={isLoading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Menghapus...' : 'Hapus Foto Profil'}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
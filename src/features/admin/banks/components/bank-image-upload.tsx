'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BankImageUploadProps {
  value?: string
  onChange: (url: string) => void
  className?: string
  disabled?: boolean
}

// Local image optimization function to avoid server-side imports
function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL, return as-is
  }

  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  if (transformations.length === 0) return url;
  
  const transformString = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

export function BankImageUpload({
  value,
  onChange,
  className,
  disabled = false
}: BankImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file
    const maxSizeMB = 5
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran file harus kurang dari ${maxSizeMB}MB`)
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'banks')
      formData.append('resourceType', 'image')

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload gagal')
      }

      const result = await response.json()
      setUploadProgress(100)
      
      setTimeout(() => {
        onChange(result.data.url)
        toast.success('Logo berhasil diupload')
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Extract error message from response if available
      let errorMessage = "Gagal mengupload logo. Silakan coba lagi.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
     } finally {
       setIsUploading(false);
       setUploadProgress(0);
     }
  }

  const handleRemove = () => {
    onChange('')
  }

  const openFileDialog = () => {
    if (disabled || isUploading) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }
    input.click()
  }

  return (
    <div className={cn("relative w-full h-full min-h-[200px]", className)}>
      {value ? (
        // Show uploaded image
        <div className="relative w-full h-full group">
          <div className="w-full h-full rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
            <img
              src={optimizeImageUrl(value, { width: 600, height: 600, quality: 85 })}
              alt="Bank logo preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-700 h-8 px-3"
                  onClick={openFileDialog}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Ganti
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  Hapus
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show upload area
        <div
          className={cn(
            "w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200",
            (disabled || isUploading) && "pointer-events-none opacity-50",
            isUploading && "border-primary bg-primary/5"
          )}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="text-center space-y-3">
              <div className="relative">
                <Upload className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Mengupload...</p>
                <div className="w-32 bg-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="p-4 bg-gray-100 rounded-full mx-auto w-fit">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Upload Logo Bank</p>
                <p className="text-xs text-gray-500">Klik untuk memilih file</p>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Format: JPG, PNG, WebP</p>
                <p>Maksimal: 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
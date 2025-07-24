'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, FileImage, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PaymentProofUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  paymentId?: string
  disabled?: boolean
  className?: string
}

// Local image optimization function
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

export function PaymentProofUpload({
  value,
  onChange,
  paymentId,
  className,
  disabled = false
}: PaymentProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Check if paymentId is provided
    if (!paymentId) {
      toast.error('Payment ID diperlukan untuk mengupload bukti transfer')
      return
    }

    // Validate file
    const maxSizeMB = 5
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran file harus kurang dari ${maxSizeMB}MB`)
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('paymentId', paymentId)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/payments/upload-proof', {
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
      
      // Immediately update the preview URL
      onChange(result.url)
      
      setTimeout(() => {
        toast.success('Bukti transfer berhasil diupload')
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Extract error message from response if available
      let errorMessage = "Gagal mengupload bukti transfer. Silakan coba lagi.";
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
    onChange(undefined)
  }

  const openFileDialog = () => {
    if (disabled || isUploading) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/jpg,image/png,application/pdf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }
    input.click()
  }

  const isImage = value && (
    value.includes('.jpg') || 
    value.includes('.jpeg') || 
    value.includes('.png') || 
    value.includes('.webp') ||
    value.includes('image/') ||
    value.match(/\.(jpg|jpeg|png|webp)$/i)
  )
  const isPdf = value && (
    value.includes('.pdf') || 
    value.includes('application/pdf') ||
    value.match(/\.pdf$/i)
  )

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Bukti Transfer</Label>
      
      <div className="relative w-full max-w-xs sm:max-w-sm mx-auto">
        {value ? (
          // Show uploaded file with professional 9:16 aspect ratio - mobile responsive
          <div className="relative w-full group">
            <div className="relative w-full aspect-[9/16] rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-lg">
              {isImage ? (
                <Image
                  src={optimizeImageUrl(value, { width: 540, height: 960, quality: 90 })}
                  alt="Bukti transfer preview"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : isPdf ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
                    <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto w-fit">
                      <FileImage className="h-8 w-8 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Dokumen PDF</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bukti transfer berhasil diupload</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
                    <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto w-fit">
                      <FileImage className="h-8 w-8 sm:h-12 sm:w-12 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">File Terupload</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bukti transfer berhasil diupload</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-white/95 hover:bg-white text-gray-700 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shadow-lg"
                    onClick={openFileDialog}
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ganti
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shadow-lg"
                    onClick={handleRemove}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Hapus
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show upload area with professional 9:16 aspect ratio - mobile responsive
          <div
            className={cn(
              "w-full aspect-[9/16] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 shadow-sm",
              (disabled || isUploading) && "pointer-events-none opacity-50",
              isUploading && "border-primary bg-primary/5 dark:bg-primary/10"
            )}
            onClick={openFileDialog}
          >
            {isUploading ? (
              <div className="text-center space-y-2 sm:space-y-3 p-4 sm:p-6">
                <div className="relative">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-primary mx-auto animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Mengupload...</p>
                  <div className="w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 sm:space-y-3 p-4 sm:p-6">
                <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto w-fit">
                  <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Upload Bukti Transfer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Klik untuk memilih file</p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <p>Format: JPG, PNG, PDF</p>
                  <p>Maksimal: 5MB</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

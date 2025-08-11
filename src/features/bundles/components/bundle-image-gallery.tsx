'use client'

import { Package } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface BundleImageGalleryProps {
  bundle: {
    id: string
    name: string
    image: string | null
    contents?: any
  }
}

export function BundleImageGallery({ bundle }: BundleImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleImageChange = (index: number) => {
    if (index === selectedImage) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedImage(index)
      setIsTransitioning(false)
    }, 150)
  }

  // Parse bundle contents to get item images if available
  const parseContents = (): any[] => {
    try {
      if (!bundle.contents) return []
      
      let rawContents = bundle.contents
      
      if (typeof bundle.contents === 'string') {
        rawContents = JSON.parse(bundle.contents)
      }
      
      if (Array.isArray(rawContents)) {
        return rawContents
      }
      
      if (typeof rawContents === 'object' && rawContents && rawContents.hasOwnProperty('items')) {
        return (rawContents as any).items || []
      }
      
      return []
    } catch (error) {
      console.error('Error parsing bundle contents:', error)
      return []
    }
  }

  const contents = parseContents()
  
  // Create image gallery including main image and item images
  const allImages = [
    { 
      id: 'main', 
      src: bundle.image, 
      alt: bundle.name,
      title: bundle.name
    },
    ...contents
      .filter((item: any) => item.image)
      .map((item: any, index: number) => ({
        id: `item-${index}`,
        src: item.image,
        alt: item.name,
        title: item.name
      }))
  ]

  const currentImage = allImages[selectedImage]

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image Display */}
      <div className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg bg-white dark:bg-gray-800">
        <div className="w-full aspect-square relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 group overflow-hidden">
          {currentImage?.src ? (
            <div className={`relative w-full h-full transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-semibold text-sm sm:text-base tracking-wide text-center">Bundle Produk</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-center px-4 leading-relaxed break-words">
                {currentImage?.title || bundle.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageChange(index)}
              className={`
                relative aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1
                ${selectedImage === index 
                  ? 'border-blue-500 ring-2 sm:ring-4 ring-blue-200 dark:ring-blue-800/50 shadow-lg scale-105' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }
              `}
            >
              {image.src ? (
                <div className="relative w-full h-full group overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-300" />
                </div>
              )}
              {index === 0 && (
                <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg font-medium shadow-sm">
                  Utama
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

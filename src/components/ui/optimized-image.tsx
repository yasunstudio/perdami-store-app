// Optimized Image component with lazy loading and performance optimizations
'use client'

import { useState, useRef, memo } from 'react'
import Image from 'next/image'
import { useIntersectionObserver } from '@/hooks/use-performance'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  quality = 80,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/images/placeholder.jpg',
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const imageRef = useRef<HTMLDivElement>(null)
  
  // Only load image when it's visible (unless priority is true)
  const isVisible = useIntersectionObserver(imageRef as React.RefObject<Element>, {
    threshold: 0.1,
    rootMargin: '50px',
  })

  const shouldLoad = priority || isVisible

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    if (!hasError && fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
    onError?.()
  }

  return (
    <div 
      ref={imageRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      {shouldLoad ? (
        <>
          <Image
            src={imageSrc}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            sizes={sizes}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

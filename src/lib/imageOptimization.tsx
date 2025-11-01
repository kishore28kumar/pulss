/**
 * Image Optimization Utilities
 * Provides lazy loading, WebP conversion, and responsive images
 */

import React, { useState, useEffect, useRef } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  lazy?: boolean
  quality?: number
}

/**
 * Optimized Image Component
 * - Lazy loading with Intersection Observer
 * - WebP support with fallback
 * - Responsive srcset
 * - Loading placeholder
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  lazy = true,
  quality = 80
}) => {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(!lazy)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!lazy) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy])

  // Generate WebP URL if supported
  const getWebPUrl = (originalUrl: string) => {
    // Check if browser supports WebP
    const supportsWebP = () => {
      const elem = document.createElement('canvas')
      if (elem.getContext && elem.getContext('2d')) {
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0
      }
      return false
    }

    if (!supportsWebP()) return originalUrl

    // If URL is from our CDN/storage, add WebP conversion parameter
    // Otherwise return original
    if (originalUrl.includes('supabase') || originalUrl.includes('cloudinary')) {
      return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    }

    return originalUrl
  }

  // Generate responsive srcset
  const getSrcSet = (originalUrl: string) => {
    const widths = [320, 640, 768, 1024, 1280]
    return widths
      .map(w => {
        // Add width parameter to URL if it's from our CDN
        if (originalUrl.includes('supabase') || originalUrl.includes('cloudinary')) {
          return `${originalUrl}?w=${w}&q=${quality} ${w}w`
        }
        return null
      })
      .filter(Boolean)
      .join(', ')
  }

  const imageSrc = inView ? (getWebPUrl(src) || src) : ''
  const srcSet = inView ? getSrcSet(src) : ''

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual image */}
      {inView && (
        <img
          src={imageSrc}
          srcSet={srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

/**
 * Image compression utilities for upload
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Could not compress image'))
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Generate responsive image sizes
 */
export const generateResponsiveSizes = (
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ')
}

/**
 * Preload critical images
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * Check WebP support
 */
export const supportsWebP = (): boolean => {
  const elem = document.createElement('canvas')
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
  return false
}

/**
 * Lazy load background images
 */
export const useLazyBackground = (imageUrl: string, threshold: number = 0.1) => {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setLoaded(true)
            observer.disconnect()
          }
        })
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return {
    ref,
    backgroundImage: loaded ? `url(${imageUrl})` : 'none',
    loaded
  }
}

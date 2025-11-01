import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Maximize,
  Download,
  Share,
  Heart,
  Star,
  ZoomIn
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ProductImage, ProductVideo, FeatureFlags } from '@/types'

interface ProductGalleryProps {
  productId: string
  tenantId: string
  productName: string
  primaryImage?: string
  onClose?: () => void
  isOpen: boolean
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  title?: string
  alt_text?: string
  is_primary?: boolean
  video_type?: 'youtube' | 'direct' | 'vimeo'
  duration?: string
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  productId,
  tenantId,
  productName,
  primaryImage,
  onClose,
  isOpen
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadFeatureFlags()
      loadMediaItems()
    }
  }, [isOpen, productId])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadMediaItems = async () => {
    setLoading(true)
    try {
      const items: MediaItem[] = []

      // Load product images if gallery is enabled
      if (featureFlags?.product_gallery_enabled) {
        const { data: images } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true })

        if (images) {
          images.forEach(img => {
            items.push({
              id: img.id,
              type: 'image',
              url: img.image_url,
              alt_text: img.alt_text,
              is_primary: img.is_primary
            })
          })
        }
      }

      // Add primary image if no gallery images found
      if (items.length === 0 && primaryImage) {
        items.push({
          id: 'primary',
          type: 'image',
          url: primaryImage,
          alt_text: productName,
          is_primary: true
        })
      }

      // Load product videos if enabled
      if (featureFlags?.product_videos_enabled) {
        const { data: videos } = await supabase
          .from('product_videos')
          .select('*')
          .eq('product_id', productId)
          .order('display_order', { ascending: true })

        if (videos) {
          videos.forEach(video => {
            items.push({
              id: video.id,
              type: 'video',
              url: video.video_url,
              thumbnail: video.thumbnail_url,
              title: video.title,
              video_type: video.video_type,
              duration: video.duration
            })
          })
        }
      }

      setMediaItems(items)
      
      // Set current index to primary image if available
      const primaryIndex = items.findIndex(item => item.is_primary)
      if (primaryIndex >= 0) {
        setCurrentIndex(primaryIndex)
      }
    } catch (error) {
      console.error('Error loading media items:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
    setIsPlaying(false)
  }

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
    setIsPlaying(false)
  }

  const getYouTubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const getYouTubeThumbnail = (url: string) => {
    const videoId = getYouTubeEmbedId(url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
  }

  const renderCurrentMedia = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (mediaItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p className="text-muted-foreground">No media available</p>
        </div>
      )
    }

    const currentItem = mediaItems[currentIndex]

    if (currentItem.type === 'image') {
      return (
        <div className="relative">
          <motion.img
            key={currentItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={currentItem.url}
            alt={currentItem.alt_text || productName}
            className={`w-full h-full object-contain max-h-96 rounded-lg ${
              isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white"
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (currentItem.type === 'video') {
      if (currentItem.video_type === 'youtube') {
        const videoId = getYouTubeEmbedId(currentItem.url)
        return (
          <div className="relative">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}${isPlaying ? '?autoplay=1' : ''}`}
              title={currentItem.title || 'Product Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            ></iframe>
            {currentItem.duration && (
              <Badge className="absolute bottom-4 right-4 bg-black/70 text-white">
                {currentItem.duration}
              </Badge>
            )}
          </div>
        )
      }

      return (
        <div className="relative">
          <video
            width="100%"
            height="400"
            controls
            className="rounded-lg"
            poster={currentItem.thumbnail}
          >
            <source src={currentItem.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    return null
  }

  const renderThumbnails = () => {
    if (mediaItems.length <= 1) return null

    return (
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-2">
          {mediaItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentIndex(index)
                setIsPlaying(false)
              }}
              className={`flex-shrink-0 relative ${
                index === currentIndex ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail || getYouTubeThumbnail(item.url)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play className="h-6 w-6 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              {item.is_primary && (
                <Badge className="absolute -top-1 -right-1 h-4 px-1 text-xs">
                  Primary
                </Badge>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this ${productName}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
    }
  }

  const handleDownload = () => {
    const currentItem = mediaItems[currentIndex]
    if (currentItem && currentItem.type === 'image') {
      const link = document.createElement('a')
      link.href = currentItem.url
      link.download = `${productName}-image-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!featureFlags?.product_gallery_enabled && !featureFlags?.product_videos_enabled) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{productName} - Media Gallery</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share className="h-4 w-4" />
              </Button>
              {mediaItems[currentIndex]?.type === 'image' && (
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6">
          {/* Main Media Display */}
          <div className="relative mb-4">
            {renderCurrentMedia()}

            {/* Navigation Buttons */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={prevItem}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={nextItem}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Media Counter */}
            {mediaItems.length > 1 && (
              <Badge className="absolute bottom-4 left-4 bg-black/70 text-white">
                {currentIndex + 1} / {mediaItems.length}
              </Badge>
            )}
          </div>

          {/* Current Media Info */}
          {mediaItems[currentIndex] && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  {mediaItems[currentIndex].title && (
                    <h4 className="font-semibold">{mediaItems[currentIndex].title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground capitalize">
                    {mediaItems[currentIndex].type}
                    {mediaItems[currentIndex].type === 'video' && mediaItems[currentIndex].video_type && 
                      ` • ${mediaItems[currentIndex].video_type}`
                    }
                    {mediaItems[currentIndex].duration && ` • ${mediaItems[currentIndex].duration}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {mediaItems[currentIndex].is_primary && (
                    <Badge variant="secondary">Primary</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Thumbnails */}
          <div className="mb-6">
            {renderThumbnails()}
          </div>
        </div>

        {/* Keyboard Navigation Hint */}
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          Use arrow keys to navigate • Press ESC to close
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Keyboard navigation support
export const useKeyboardNavigation = (isOpen: boolean, onNext: () => void, onPrev: () => void, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          onNext()
          break
        case 'ArrowLeft':
          onPrev()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onNext, onPrev, onClose])
}

// Hook for managing product gallery
export const useProductGallery = (productId: string, tenantId: string) => {
  const [isOpen, setIsOpen] = useState(false)

  const openGallery = () => setIsOpen(true)
  const closeGallery = () => setIsOpen(false)

  return {
    isOpen,
    openGallery,
    closeGallery
  }
}

export default ProductGallery
/**
 * Product Image Gallery with Zoom
 * Provides interactive image viewing experience
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from './dialog'
import { Button } from './button'
import {
  X,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { modalOverlay, modalContent, fadeIn } from '@/lib/animations'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export const ProductImageGallery = ({
  images,
  productName,
  className,
}: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const currentImage = images[currentIndex] || images[0]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
        <motion.img
          key={currentImage}
          src={currentImage}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Zoom Button */}
        <motion.button
          className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MagnifyingGlassPlus className="w-5 h-5" weight="bold" />
        </motion.button>

        {/* Navigation Arrows - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <motion.button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <CaretLeft className="w-5 h-5" weight="bold" />
            </motion.button>

            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <CaretRight className="w-5 h-5" weight="bold" />
            </motion.button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 text-white rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                currentIndex === index
                  ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsZoomOpen(false)}
            >
              <X className="w-6 h-6" weight="bold" />
            </Button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
              >
                <MagnifyingGlassMinus className="w-5 h-5" weight="bold" />
              </Button>
              <div className="px-3 py-2 bg-white/20 text-white rounded-full text-sm font-medium">
                {Math.round(zoomLevel * 100)}%
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <MagnifyingGlassPlus className="w-5 h-5" weight="bold" />
              </Button>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                  onClick={() => {
                    goToPrevious()
                    setZoomLevel(1)
                  }}
                >
                  <CaretLeft className="w-8 h-8" weight="bold" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full"
                  onClick={() => {
                    goToNext()
                    setZoomLevel(1)
                  }}
                >
                  <CaretRight className="w-8 h-8" weight="bold" />
                </Button>
              </>
            )}

            {/* Zoomed Image */}
            <motion.div
              className="overflow-hidden cursor-move"
              style={{ scale: zoomLevel }}
              drag={zoomLevel > 1}
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0.1}
            >
              <img
                src={currentImage}
                alt={`${productName} - Zoomed`}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </motion.div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Compact version for cards
export const ProductImageThumbnail = ({
  image,
  alt,
  onZoom,
}: {
  image: string
  alt: string
  onZoom?: () => void
}) => {
  return (
    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
      <img src={image} alt={alt} className="w-full h-full object-cover" />
      {onZoom && (
        <motion.button
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onZoom}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MagnifyingGlassPlus className="w-8 h-8 text-white" weight="bold" />
        </motion.button>
      )}
    </div>
  )
}

// Image with hover zoom effect (no modal)
export const ProductImageHoverZoom = ({
  image,
  alt,
  className,
}: {
  image: string
  alt: string
  className?: string
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn('relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.img
        src={image}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

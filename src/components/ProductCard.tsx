import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ShoppingCart, Plus, Minus, Heart, Star, Eye } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { cardHover, cardTap, buttonHover, buttonTap, scaleIn } from '@/lib/animations'
import { GradientDiscountBadge, NewBadge, BestSellerBadge, RatingBadge } from './ui/enhanced-badge'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  brand?: string | null
  pack_size?: string | null
  mrp: number
  price: number
  image_url?: string | null
  requires_rx: boolean
  category_name?: string
  description?: string | null
  categories?: {
    name: string
  }
  rating?: number
  review_count?: number
  is_new?: boolean
  is_bestseller?: boolean
}

interface ProductCardProps {
  product: Product
  onAddToCart?: () => void
  showAddToCart?: boolean
  featured?: boolean
  onQuickView?: () => void
}

export const ProductCard = ({ product, onAddToCart, showAddToCart = true, featured = false, onQuickView }: ProductCardProps) => {
  const [cart, setCart] = useKV<Array<{id: string, quantity: number, product: Product}>>('cart', [])
  const [isFavorite, setIsFavorite] = useKV<string[]>('favorites', [])
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)

  const cartItem = cart?.find(item => item.id === product.id)
  const currentQuantity = cartItem?.quantity || 0

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((currentCart) => (currentCart || []).filter(item => item.id !== product.id))
      toast.success('Removed from cart')
    } else {
      setCart((currentCart) => {
        const safeCart = currentCart || []
        const existingItemIndex = safeCart.findIndex(item => item.id === product.id)
        
        if (existingItemIndex >= 0) {
          const newCart = [...safeCart]
          newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newQuantity }
          return newCart
        } else {
          toast.success('Added to cart')
          return [...safeCart, { id: product.id, quantity: newQuantity, product }]
        }
      })
    }
    
    if (onAddToCart && newQuantity > currentQuantity) {
      onAddToCart()
    }
  }

  const toggleFavorite = () => {
    setIsFavorite((current) => {
      const safeFavorites = current || []
      if (safeFavorites.includes(product.id)) {
        toast.success('Removed from wishlist')
        return safeFavorites.filter(id => id !== product.id)
      } else {
        toast.success('Added to wishlist')
        return [...safeFavorites, product.id]
      }
    })
  }

  const isInFavorites = isFavorite?.includes(product.id)
  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100)
  const hasDiscount = product.price < product.mrp

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onHoverStart={() => setShowQuickView(true)}
      onHoverEnd={() => setShowQuickView(false)}
    >
      <Card className={`group relative border-0 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-xl bg-white dark:bg-gray-800 ${featured ? 'ring-2 ring-yellow-400 shadow-yellow-100' : ''}`}>
        <div className="relative">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
            <motion.img
              src={product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onLoad={() => setIsImageLoaded(true)}
              style={{ opacity: isImageLoaded ? 1 : 0 }}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_new && <NewBadge />}
            {product.is_bestseller && <BestSellerBadge />}
            {hasDiscount && <GradientDiscountBadge discount={discountPercent} />}
            {product.requires_rx && (
              <Badge className="text-xs px-2 bg-blue-500 text-white shadow-md">
                Rx Required
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickView && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-3 right-3 flex flex-col gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFavorite}
                  className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Heart 
                    className={`h-5 w-5 ${isInFavorites ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
                    weight={isInFavorites ? 'fill' : 'regular'}
                  />
                </motion.button>
                {onQuickView && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onQuickView}
                    className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {(product.categories?.name || product.category_name) && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide font-semibold">
              {product.categories?.name || product.category_name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight text-gray-900 dark:text-gray-100 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Brand & Pack Size */}
          {(product.brand || product.pack_size) && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {product.brand && <span className="font-medium">{product.brand}</span>}
              {product.brand && product.pack_size && <span className="mx-1">•</span>}
              {product.pack_size && <span>{product.pack_size}</span>}
            </div>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    weight={star <= Math.round(product.rating!) ? 'fill' : 'regular'}
                    className={`w-3 h-3 ${star <= Math.round(product.rating!) ? 'text-amber-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {product.rating.toFixed(1)}
                {product.review_count && ` (${product.review_count})`}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ₹{product.price}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ₹{product.mrp}
                </span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Save ₹{product.mrp - product.price}
                </span>
              </>
            )}
          </div>

          {/* Add to Cart */}
          {showAddToCart && (
            <AnimatePresence mode="wait">
              {currentQuantity === 0 ? (
                <motion.div
                  key="add-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    onClick={() => handleQuantityChange(1)}
                    size="sm" 
                    className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    <ShoppingCart className="h-4 w-4" weight="bold" />
                    <span>Add to Cart</span>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="quantity-controls"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(currentQuantity - 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" weight="bold" />
                    </motion.button>
                    <span className="font-bold min-w-[32px] text-center text-gray-900 dark:text-white">
                      {currentQuantity}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(currentQuantity + 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" weight="bold" />
                    </motion.button>
                  </div>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                    ₹{(product.price * currentQuantity).toFixed(2)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
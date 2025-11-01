import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ShoppingCart, Plus, Minus, Heart, Star, ArrowRight } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { motion } from 'framer-motion'

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
  featured?: boolean
}

interface EnhancedProductCardProps {
  product: Product
  onAddToCart?: () => void
  onView?: () => void
  showAddToCart?: boolean
  featured?: boolean
  compact?: boolean
  trending?: boolean
  topSeller?: boolean
  personalized?: boolean
  showBadge?: boolean
  customersAlsoBought?: boolean
}

export const EnhancedProductCard = ({ 
  product, 
  onAddToCart, 
  onView,
  showAddToCart = true, 
  featured = false,
  compact = false,
  trending = false,
  topSeller = false,
  personalized = false,
  showBadge = true,
  customersAlsoBought = false
}: EnhancedProductCardProps) => {
  const [cart, setCart] = useKV<Array<{id: string, quantity: number, product: Product}>>('cart', [])
  const [isFavorite, setIsFavorite] = useKV<string[]>('favorites', [])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const cartItem = cart?.find(item => item.id === product.id)
  const currentQuantity = cartItem?.quantity || 0

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((currentCart) => (currentCart || []).filter(item => item.id !== product.id))
    } else {
      setCart((currentCart) => {
        const safeCart = currentCart || []
        const existingItemIndex = safeCart.findIndex(item => item.id === product.id)
        
        if (existingItemIndex >= 0) {
          const newCart = [...safeCart]
          newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newQuantity }
          return newCart
        } else {
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
        return safeFavorites.filter(id => id !== product.id)
      } else {
        return [...safeFavorites, product.id]
      }
    })
  }

  const isInFavorites = isFavorite?.includes(product.id)
  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100)
  const hasDiscount = product.price < product.mrp

  const getImageUrl = () => {
    if (imageError || !product.image_url) {
      // Return a more sophisticated placeholder based on category
      const categoryName = product.categories?.name || product.category_name || ''
      if (categoryName.toLowerCase().includes('medicine') || categoryName.toLowerCase().includes('tablet')) {
        return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'
      } else if (categoryName.toLowerCase().includes('supplement')) {
        return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop'
      } else if (categoryName.toLowerCase().includes('care') || categoryName.toLowerCase().includes('cosmetic')) {
        return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop'
      } else {
        return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop'
      }
    }
    return product.image_url
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={compact ? "w-full" : "w-full max-w-sm"}
    >
      <Card className={`group hover:shadow-xl transition-all duration-500 border-0 shadow-md overflow-hidden bg-white/80 backdrop-blur-sm ${featured ? 'ring-2 ring-yellow-300 ring-offset-2' : ''} ${compact ? 'h-auto' : 'h-full'}`}>
        <div className="relative">
          {/* Product Image */}
          <div className={`${compact ? 'aspect-square' : 'aspect-[4/3]'} overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative`}>
            <img
              src={getImageUrl()}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 space-y-1">
            {trending && showBadge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 shadow-lg">
                  🔥 Trending
                </Badge>
              </motion.div>
            )}
            {topSeller && showBadge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  Top Seller
                </Badge>
              </motion.div>
            )}
            {personalized && showBadge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 shadow-lg">
                  ✨ For You
                </Badge>
              </motion.div>
            )}
            {customersAlsoBought && showBadge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-2 py-1 shadow-lg">
                  👥 Popular
                </Badge>
              </motion.div>
            )}
            {featured && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </motion.div>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs px-2 py-1 shadow-lg font-bold">
                {discountPercent}% OFF
              </Badge>
            )}
            {product.requires_rx && (
              <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 shadow-sm font-medium">
                Rx Required
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm rounded-full border border-gray-200"
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${isInFavorites ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} 
            />
          </Button>

          {/* Quick View/Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView && onView()}
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm rounded-full px-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs"
          >
            Quick View
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <CardContent className={`${compact ? 'p-3' : 'p-4'} flex flex-col h-full`}>
          {/* Category */}
          {(product.categories?.name || product.category_name) && (
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
              {product.categories?.name || product.category_name}
            </p>
          )}

          {/* Product Name */}
          <h3 className={`font-semibold ${compact ? 'text-sm mb-1' : 'text-base mb-2'} line-clamp-2 leading-tight text-gray-900 group-hover:text-primary transition-colors`}>
            {product.name}
          </h3>

          {/* Brand & Pack Size */}
          <div className={`text-xs text-muted-foreground ${compact ? 'mb-2' : 'mb-3'}`}>
            {product.brand && <span className="font-medium text-gray-600">{product.brand}</span>}
            {product.brand && product.pack_size && <span className="mx-1">•</span>}
            {product.pack_size && <span>{product.pack_size}</span>}
          </div>

          <div className="flex-grow"></div>

          {/* Price */}
          <div className={`flex items-center space-x-2 ${compact ? 'mb-2' : 'mb-3'}`}>
            <span className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-primary`}>
              ₹{product.price}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.mrp}
                </span>
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                  Save ₹{product.mrp - product.price}
                </span>
              </>
            )}
          </div>

          {/* Add to Cart */}
          {showAddToCart && (
            <div className="mt-auto">
              {currentQuantity === 0 ? (
                <Button 
                  onClick={() => handleQuantityChange(1)}
                  size={compact ? "sm" : "default"}
                  className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </Button>
              ) : (
                <div className="flex items-center justify-between w-full bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(currentQuantity - 1)}
                      className="h-8 w-8 border-gray-300 hover:border-primary hover:text-primary"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-bold text-primary min-w-[32px] text-center">
                      {currentQuantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(currentQuantity + 1)}
                      className="h-8 w-8 border-gray-300 hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      ₹{product.price * currentQuantity}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
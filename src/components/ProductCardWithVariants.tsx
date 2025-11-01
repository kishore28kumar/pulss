import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ShoppingCart, Plus, Minus, Heart } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { VariantSelector } from './VariantSelector'

interface Variant {
  variant_id: string
  variant_name: string
  variant_type: string
  price: number
  mrp: number
  inventory_count: number
  is_default: boolean
  active: boolean
}

interface VariantsByType {
  [key: string]: Variant[]
}

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
  variants?: Variant[]
  variantsByType?: VariantsByType
}

interface ProductCardProps {
  product: Product
  onAddToCart?: () => void
  showAddToCart?: boolean
  featured?: boolean
}

export const ProductCardWithVariants: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  showAddToCart = true, 
  featured = false 
}) => {
  const [cart, setCart] = useKV<Array<{id: string, quantity: number, product: Product, variantId?: string}>>('cart', [])
  const [isFavorite, setIsFavorite] = useKV<string[]>('favorites', [])
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: Variant }>({})
  const [currentPrice, setCurrentPrice] = useState(product.price)
  const [currentMrp, setCurrentMrp] = useState(product.mrp)
  const [inStock, setInStock] = useState(true)

  // Create a unique cart key that includes variant selection
  const getCartKey = () => {
    const variantIds = Object.values(selectedVariants)
      .map(v => v.variant_id)
      .sort()
      .join('-')
    return variantIds ? `${product.id}-${variantIds}` : product.id
  }

  const cartItem = cart?.find(item => item.id === getCartKey())
  const currentQuantity = cartItem?.quantity || 0

  // Update price when variants change
  useEffect(() => {
    const variants = Object.values(selectedVariants)
    if (variants.length > 0) {
      // Use the price from the first variant that has a price set
      const variantWithPrice = variants.find(v => v.price)
      if (variantWithPrice) {
        setCurrentPrice(variantWithPrice.price)
        setCurrentMrp(variantWithPrice.mrp)
      }
      
      // Check if all selected variants are in stock
      const allInStock = variants.every(v => v.active && v.inventory_count > 0)
      setInStock(allInStock)
    } else {
      setCurrentPrice(product.price)
      setCurrentMrp(product.mrp)
      setInStock(true)
    }
  }, [selectedVariants, product.price, product.mrp])

  const handleQuantityChange = (newQuantity: number) => {
    const cartKey = getCartKey()
    
    if (newQuantity <= 0) {
      setCart((currentCart) => (currentCart || []).filter(item => item.id !== cartKey))
    } else {
      setCart((currentCart) => {
        const safeCart = currentCart || []
        const existingItemIndex = safeCart.findIndex(item => item.id === cartKey)
        
        const variantInfo = Object.values(selectedVariants).length > 0 
          ? Object.values(selectedVariants)[0].variant_id 
          : undefined
        
        if (existingItemIndex >= 0) {
          const newCart = [...safeCart]
          newCart[existingItemIndex] = { 
            ...newCart[existingItemIndex], 
            quantity: newQuantity 
          }
          return newCart
        } else {
          return [...safeCart, { 
            id: cartKey, 
            quantity: newQuantity, 
            product: {
              ...product,
              price: currentPrice,
              mrp: currentMrp
            },
            variantId: variantInfo
          }]
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

  const handleVariantChange = (newVariants: { [key: string]: Variant }) => {
    setSelectedVariants(newVariants)
  }

  const isInFavorites = isFavorite?.includes(product.id)
  const discountPercent = Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
  const hasDiscount = currentPrice < currentMrp
  const hasVariants = product.variants && product.variants.length > 0

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-sm overflow-hidden ${featured ? 'ring-2 ring-yellow-200' : ''}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {featured && (
            <Badge className="bg-yellow-500 text-yellow-50 text-xs px-2">
              ⭐ Featured
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs px-2">
              {discountPercent}% OFF
            </Badge>
          )}
          {product.requires_rx && (
            <Badge variant="outline" className="text-xs px-2 bg-white/90 text-blue-700 border-blue-200">
              Rx Required
            </Badge>
          )}
          {!inStock && (
            <Badge variant="destructive" className="text-xs px-2">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
        >
          <Heart 
            className={`h-4 w-4 ${isInFavorites ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
          />
        </Button>
      </div>

      <CardContent className="p-4">
        {/* Category */}
        {(product.categories?.name || product.category_name) && (
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {product.categories?.name || product.category_name}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Brand & Pack Size */}
        <div className="text-xs text-muted-foreground mb-2">
          {product.brand && <span className="font-medium">{product.brand}</span>}
          {product.brand && product.pack_size && <span className="mx-1">•</span>}
          {product.pack_size && <span>{product.pack_size}</span>}
        </div>

        {/* Variant Selector */}
        {hasVariants && product.variantsByType && (
          <div className="mb-3">
            <VariantSelector
              variants={product.variants || []}
              variantsByType={product.variantsByType}
              onVariantChange={handleVariantChange}
            />
          </div>
        )}

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-lg font-bold text-primary">
            ₹{currentPrice}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{currentMrp}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {showAddToCart && (
          <div className="flex items-center justify-between">
            {currentQuantity === 0 ? (
              <Button 
                onClick={() => handleQuantityChange(1)}
                size="sm" 
                className="w-full flex items-center justify-center space-x-2"
                disabled={!inStock}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </Button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(currentQuantity - 1)}
                    className="h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium min-w-[24px] text-center">
                    {currentQuantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(currentQuantity + 1)}
                    className="h-8 w-8"
                    disabled={!inStock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-medium text-primary">
                  ₹{currentPrice * currentQuantity}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

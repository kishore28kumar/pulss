/**
 * Product Discovery Sections
 * Includes Recommended Products, Best Sellers, Recently Viewed, etc.
 */

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from './button'
import { Card } from './card'
import { useKV } from '@github/spark/hooks'
import { 
  ArrowRight, 
  Fire, 
  Sparkle, 
  Clock,
  TrendUp,
  Star,
} from '@phosphor-icons/react'
import { staggerContainer, staggerItem, gridContainer, gridItem } from '@/lib/animations'
import { ProductGridSkeleton } from './skeleton'
import { EmptyState } from './empty-state'

interface Product {
  id: string
  name: string
  brand?: string
  price: number
  mrp: number
  image_url?: string
  rating?: number
  is_bestseller?: boolean
  is_new?: boolean
  category_name?: string
}

interface ProductSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  products: Product[]
  loading?: boolean
  onSeeAll?: () => void
  renderProduct: (product: Product) => React.ReactNode
  emptyMessage?: string
  limit?: number
}

export const ProductSection = ({
  title,
  description,
  icon,
  products,
  loading = false,
  onSeeAll,
  renderProduct,
  emptyMessage = 'No products found',
  limit = 8,
}: ProductSectionProps) => {
  const displayProducts = products.slice(0, limit)

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <ProductGridSkeleton count={limit} />
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <EmptyState title={emptyMessage} illustration="products" />
        </div>
      </section>
    )
  }

  return (
    <motion.section
      className="py-8"
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div variants={staggerItem} className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {icon && <div className="text-2xl">{icon}</div>}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
            </div>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>
          {onSeeAll && products.length > limit && (
            <Button
              onClick={onSeeAll}
              variant="ghost"
              className="group hidden md:flex items-center gap-2"
            >
              See All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </motion.div>

        {/* Products Grid */}
        <motion.div
          variants={gridContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {displayProducts.map((product) => (
            <motion.div key={product.id} variants={gridItem}>
              {renderProduct(product)}
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile See All Button */}
        {onSeeAll && products.length > limit && (
          <div className="mt-6 md:hidden">
            <Button onClick={onSeeAll} className="w-full" variant="outline">
              See All {products.length} Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  )
}

// Recommended Products Section
interface RecommendedProductsProps {
  products: Product[]
  loading?: boolean
  renderProduct: (product: Product) => React.ReactNode
  onSeeAll?: () => void
}

export const RecommendedProducts = ({
  products,
  loading,
  renderProduct,
  onSeeAll,
}: RecommendedProductsProps) => {
  return (
    <ProductSection
      title="Recommended for You"
      description="Products we think you'll love based on your browsing"
      icon={<Sparkle className="text-purple-500" weight="fill" />}
      products={products}
      loading={loading}
      renderProduct={renderProduct}
      onSeeAll={onSeeAll}
      emptyMessage="No recommendations available"
    />
  )
}

// Best Sellers Section
interface BestSellersProps {
  products: Product[]
  loading?: boolean
  renderProduct: (product: Product) => React.ReactNode
  onSeeAll?: () => void
}

export const BestSellers = ({
  products,
  loading,
  renderProduct,
  onSeeAll,
}: BestSellersProps) => {
  return (
    <ProductSection
      title="Best Sellers"
      description="Most popular products in our store"
      icon={<Fire className="text-orange-500" weight="fill" />}
      products={products}
      loading={loading}
      renderProduct={renderProduct}
      onSeeAll={onSeeAll}
      emptyMessage="No best sellers available"
    />
  )
}

// Recently Viewed Section
interface RecentlyViewedProps {
  renderProduct: (product: Product) => React.ReactNode
  onSeeAll?: () => void
}

export const RecentlyViewed = ({
  renderProduct,
  onSeeAll,
}: RecentlyViewedProps) => {
  const [recentlyViewed] = useKV<Product[]>('recently_viewed', [])

  // Filter out duplicates and limit to recent items
  const uniqueProducts = recentlyViewed?.reduce((acc: Product[], current: Product) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current)
    }
    return acc
  }, []) || []

  if (uniqueProducts.length === 0) {
    return null
  }

  return (
    <ProductSection
      title="Recently Viewed"
      description="Products you've looked at recently"
      icon={<Clock className="text-blue-500" weight="fill" />}
      products={uniqueProducts}
      renderProduct={renderProduct}
      onSeeAll={onSeeAll}
      emptyMessage="No recently viewed products"
      limit={4}
    />
  )
}

// Trending Products Section
interface TrendingProductsProps {
  products: Product[]
  loading?: boolean
  renderProduct: (product: Product) => React.ReactNode
  onSeeAll?: () => void
}

export const TrendingProducts = ({
  products,
  loading,
  renderProduct,
  onSeeAll,
}: TrendingProductsProps) => {
  return (
    <ProductSection
      title="Trending Now"
      description="What's hot in healthcare right now"
      icon={<TrendUp className="text-green-500" weight="fill" />}
      products={products}
      loading={loading}
      renderProduct={renderProduct}
      onSeeAll={onSeeAll}
      emptyMessage="No trending products available"
    />
  )
}

// Top Rated Products Section
interface TopRatedProductsProps {
  products: Product[]
  loading?: boolean
  renderProduct: (product: Product) => React.ReactNode
  onSeeAll?: () => void
}

export const TopRatedProducts = ({
  products,
  loading,
  renderProduct,
  onSeeAll,
}: TopRatedProductsProps) => {
  return (
    <ProductSection
      title="Top Rated"
      description="Highly rated by our customers"
      icon={<Star className="text-amber-500" weight="fill" />}
      products={products}
      loading={loading}
      renderProduct={renderProduct}
      onSeeAll={onSeeAll}
      emptyMessage="No top rated products available"
    />
  )
}

// Hook to track recently viewed products
export const useTrackRecentlyViewed = () => {
  const [, setRecentlyViewed] = useKV<Product[]>('recently_viewed', [])

  const trackProduct = (product: Product) => {
    setRecentlyViewed((current) => {
      const existing = current || []
      // Remove if already exists
      const filtered = existing.filter(p => p.id !== product.id)
      // Add to beginning
      return [product, ...filtered].slice(0, 20) // Keep last 20
    })
  }

  return trackProduct
}

// Category showcase with horizontal scroll
interface CategoryShowcaseProps {
  categories: Array<{
    id: string
    name: string
    icon?: string
    image?: string
    product_count?: number
  }>
  onCategoryClick?: (categoryId: string) => void
}

export const CategoryShowcase = ({ categories, onCategoryClick }: CategoryShowcaseProps) => {
  return (
    <section className="py-8 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Shop by Category
        </h2>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => onCategoryClick?.(category.id)}
              className="flex-shrink-0 group"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="w-40 h-40 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 hover:shadow-xl transition-all border-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">{category.icon || '📦'}</span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-center mb-1 text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                {category.product_count && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.product_count} items
                  </p>
                )}
              </Card>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

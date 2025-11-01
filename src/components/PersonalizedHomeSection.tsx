import React, { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  Star,
  Clock,
  Users,
  Heart,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Gift
} from '@phosphor-icons/react'
import { EnhancedProductCard } from './EnhancedProductCard'
import { createRecommendationEngine } from '@/lib/recommendations'
import { supabase } from '@/lib/supabase'
import { Product, FeatureFlags } from '@/types'
import { useAuth } from '@/lib/useAuth'

interface PersonalizedHomeSectionProps {
  tenantId: string
  customerId?: string
  sessionId?: string
  onAddToCart: (product: Product) => void
}

interface PersonalizedBanner {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  type: string
}

export const PersonalizedHomeSection: React.FC<PersonalizedHomeSectionProps> = ({
  tenantId,
  customerId,
  sessionId,
  onAddToCart
}) => {
  const { user } = useAuth()
  const [featureFlags, setFeatureFlags] = useKV<FeatureFlags | null>('feature-flags', null)
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [topSellers, setTopSellers] = useState<Product[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([])
  const [personalizedBanners, setPersonalizedBanners] = useState<PersonalizedBanner[]>([])
  const [loading, setLoading] = useState(true)

  const recommendationEngine = createRecommendationEngine(tenantId)

  useEffect(() => {
    loadFeatureFlags()
  }, [tenantId])

  useEffect(() => {
    if (featureFlags) {
      loadRecommendations()
    }
  }, [featureFlags, customerId, sessionId])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      if (flags) {
        setFeatureFlags(flags)
      }
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const promises = []

      // Load trending products if enabled
      if (featureFlags?.recommendations_enabled) {
        promises.push(recommendationEngine.getTrendingProducts(8))
        promises.push(recommendationEngine.getTopSellers(8))
      }

      // Load personalized data if user is logged in
      if (customerId && featureFlags?.personalization_enabled) {
        promises.push(recommendationEngine.getRecentlyViewed(customerId, 6))
        promises.push(recommendationEngine.getPersonalizedRecommendations(customerId, 8))
        promises.push(recommendationEngine.getPersonalizedBanners(customerId))
      }

      const results = await Promise.all(promises)
      
      let index = 0
      if (featureFlags?.recommendations_enabled) {
        setTrendingProducts(results[index++] || [])
        setTopSellers(results[index++] || [])
      }

      if (customerId && featureFlags?.personalization_enabled) {
        setRecentlyViewed(results[index++] || [])
        setPersonalizedProducts(results[index++] || [])
        setPersonalizedBanners(results[index++] || [])
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductView = async (productId: string) => {
    if (featureFlags?.tracking_enabled) {
      await recommendationEngine.trackProductView(productId, customerId, sessionId)
    }
  }

  if (!featureFlags?.recommendations_enabled && !featureFlags?.personalization_enabled) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Personalized Banners */}
      {featureFlags?.personalization_enabled && personalizedBanners.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Just for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalizedBanners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                  <div className="absolute inset-0 p-4 text-white">
                    <h3 className="text-lg font-semibold mb-1">{banner.title}</h3>
                    <p className="text-sm opacity-90 mb-2">{banner.description}</p>
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                      Learn More
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Gift className="h-6 w-6 text-white/60" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {featureFlags?.personalization_enabled && recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              Recently Viewed
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyViewed.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onAddToCart={() => onAddToCart(product)}
                onView={() => handleProductView(product.id)}
                compact
                showBadge={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Now */}
      {featureFlags?.recommendations_enabled && trendingProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              Trending Now
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                Hot
              </Badge>
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {trendingProducts.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onAddToCart={() => onAddToCart(product)}
                onView={() => handleProductView(product.id)}
                compact
                trending
              />
            ))}
          </div>
        </section>
      )}

      {/* Top Sellers */}
      {featureFlags?.recommendations_enabled && topSellers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Top Sellers
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">
                Popular
              </Badge>
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {topSellers.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onAddToCart={() => onAddToCart(product)}
                onView={() => handleProductView(product.id)}
                compact
                topSeller
              />
            ))}
          </div>
        </section>
      )}

      {/* Personalized Recommendations */}
      {featureFlags?.personalization_enabled && personalizedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500" />
              Recommended for You
              <Badge variant="secondary" className="ml-2 bg-pink-100 text-pink-700">
                Personal
              </Badge>
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {personalizedProducts.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onAddToCart={() => onAddToCart(product)}
                onView={() => handleProductView(product.id)}
                compact
                personalized
              />
            ))}
          </div>
        </section>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}

// Hook for tracking product views
export const useProductTracking = (tenantId: string, customerId?: string, sessionId?: string) => {
  const recommendationEngine = createRecommendationEngine(tenantId)

  const trackView = async (productId: string) => {
    await recommendationEngine.trackProductView(productId, customerId, sessionId)
  }

  const trackPurchase = async (orderId: string) => {
    if (customerId) {
      await recommendationEngine.trackProductPurchase(orderId, customerId)
    }
  }

  return { trackView, trackPurchase }
}
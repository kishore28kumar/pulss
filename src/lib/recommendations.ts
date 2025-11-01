import { supabase } from './supabase'
import { Product, ProductRecommendation, Customer, RecentlyViewed } from '@/types'

export class RecommendationEngine {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * Get trending products based on recent views and purchases
   */
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    try {
      const { data: recommendations } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('recommendation_type', 'trending')
        .order('score', { ascending: false })
        .limit(limit)

      return recommendations?.map(r => r.product).filter(Boolean) || []
    } catch (error) {
      console.error('Error fetching trending products:', error)
      return []
    }
  }

  /**
   * Get top selling products
   */
  async getTopSellers(limit: number = 10): Promise<Product[]> {
    try {
      const { data: recommendations } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('recommendation_type', 'top_sellers')
        .order('score', { ascending: false })
        .limit(limit)

      return recommendations?.map(r => r.product).filter(Boolean) || []
    } catch (error) {
      console.error('Error fetching top sellers:', error)
      return []
    }
  }

  /**
   * Get recently viewed products for a customer
   */
  async getRecentlyViewed(customerId: string, limit: number = 10): Promise<Product[]> {
    try {
      const { data: recentlyViewed } = await supabase
        .from('recently_viewed')
        .select(`
          *,
          product:products(*)
        `)
        .eq('customer_id', customerId)
        .order('viewed_at', { ascending: false })
        .limit(limit)

      return recentlyViewed?.map(rv => rv.product).filter(Boolean) || []
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
      return []
    }
  }

  /**
   * Get "Customers Also Bought" recommendations for a product
   */
  async getCustomersAlsoBought(productId: string, limit: number = 8): Promise<Product[]> {
    try {
      const { data: recommendations } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('recommendation_type', 'customers_also_bought')
        .eq('source_product_id', productId)
        .order('score', { ascending: false })
        .limit(limit)

      return recommendations?.map(r => r.product).filter(Boolean) || []
    } catch (error) {
      console.error('Error fetching customers also bought:', error)
      return []
    }
  }

  /**
   * Get personalized recommendations for a customer
   */
  async getPersonalizedRecommendations(customerId: string, limit: number = 12): Promise<Product[]> {
    try {
      const { data: recommendations } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', this.tenantId)
        .eq('recommendation_type', 'personalized')
        .eq('customer_id', customerId)
        .order('score', { ascending: false })
        .limit(limit)

      return recommendations?.map(r => r.product).filter(Boolean) || []
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error)
      return []
    }
  }

  /**
   * Track product view for recommendations
   */
  async trackProductView(productId: string, customerId?: string, sessionId?: string): Promise<void> {
    try {
      // Record in recently viewed
      await supabase
        .from('recently_viewed')
        .upsert({
          product_id: productId,
          customer_id: customerId || null,
          session_id: sessionId || null,
          viewed_at: new Date().toISOString()
        })

      // Update trending score (simplified algorithm)
      await this.updateTrendingScore(productId)
    } catch (error) {
      console.error('Error tracking product view:', error)
    }
  }

  /**
   * Track product purchase for recommendations
   */
  async trackProductPurchase(orderId: string, customerId: string): Promise<void> {
    try {
      // Fetch order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (!orderItems) return

      // Update top sellers scores
      for (const item of orderItems) {
        await this.updateTopSellersScore(item.product_id, item.quantity)
      }

      // Generate "customers also bought" recommendations
      await this.generateCustomersAlsoBoughtRecommendations(orderItems.map(i => i.product_id))
      
      // Update personalized recommendations
      await this.updatePersonalizedRecommendations(customerId, orderItems.map(i => i.product_id))
    } catch (error) {
      console.error('Error tracking product purchase:', error)
    }
  }

  /**
   * Generate personalized homepage banners for a customer
   */
  async getPersonalizedBanners(customerId: string): Promise<any[]> {
    try {
      const customer = await this.getCustomerProfile(customerId)
      if (!customer) return []

      const banners = []

      // Rule 1: If customer has made more than 5 orders, show loyalty banner
      if (customer.total_orders > 5) {
        banners.push({
          id: 'loyalty-banner',
          title: 'Welcome Back, Valued Customer!',
          description: `You've made ${customer.total_orders} orders with us. Enjoy exclusive benefits!`,
          image_url: '/images/loyalty-banner.jpg',
          link_url: '/loyalty',
          type: 'loyalty'
        })
      }

      // Rule 2: If customer hasn't ordered in 30 days, show comeback offer
      const daysSinceLastOrder = customer.last_order_date 
        ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (daysSinceLastOrder > 30) {
        banners.push({
          id: 'comeback-banner',
          title: 'We Miss You!',
          description: 'Get 10% off on your next order. Welcome back!',
          image_url: '/images/comeback-offer.jpg',
          link_url: '/products?discount=comeback10',
          type: 'comeback'
        })
      }

      // Rule 3: Show category-based banners based on purchase history
      const favoriteCategory = customer.favorite_category
      if (favoriteCategory) {
        banners.push({
          id: 'category-banner',
          title: `New Arrivals in ${favoriteCategory}`,
          description: 'Check out our latest products in your favorite category',
          image_url: `/images/category-${favoriteCategory.toLowerCase()}.jpg`,
          link_url: `/category/${favoriteCategory}`,
          type: 'category'
        })
      }

      return banners.slice(0, 2) // Limit to 2 personalized banners
    } catch (error) {
      console.error('Error generating personalized banners:', error)
      return []
    }
  }

  private async updateTrendingScore(productId: string): Promise<void> {
    // Simplified trending algorithm - in production, this would be more sophisticated
    const score = Math.random() * 100 // Placeholder scoring
    
    await supabase
      .from('product_recommendations')
      .upsert({
        tenant_id: this.tenantId,
        recommendation_type: 'trending',
        recommended_product_id: productId,
        score,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
  }

  private async updateTopSellersScore(productId: string, quantity: number): Promise<void> {
    // Get existing score
    const { data: existing } = await supabase
      .from('product_recommendations')
      .select('score')
      .eq('tenant_id', this.tenantId)
      .eq('recommendation_type', 'top_sellers')
      .eq('recommended_product_id', productId)
      .single()

    const newScore = (existing?.score || 0) + quantity

    await supabase
      .from('product_recommendations')
      .upsert({
        tenant_id: this.tenantId,
        recommendation_type: 'top_sellers',
        recommended_product_id: productId,
        score: newScore,
        created_at: new Date().toISOString()
      })
  }

  private async generateCustomersAlsoBoughtRecommendations(purchasedProductIds: string[]): Promise<void> {
    // Find orders that contain any of these products
    const { data: relatedOrders } = await supabase
      .from('order_items')
      .select(`
        order_id,
        product_id,
        orders!inner(customer_id, tenant_id)
      `)
      .eq('orders.tenant_id', this.tenantId)
      .in('product_id', purchasedProductIds)

    if (!relatedOrders) return

    // Group by order to find co-purchased products
    const orderGroups: { [orderId: string]: string[] } = {}
    relatedOrders.forEach(item => {
      if (!orderGroups[item.order_id]) {
        orderGroups[item.order_id] = []
      }
      orderGroups[item.order_id].push(item.product_id)
    })

    // Calculate co-purchase frequencies
    const coPurchaseFreq: { [key: string]: number } = {}
    
    Object.values(orderGroups).forEach(productIds => {
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const pair = [productIds[i], productIds[j]].sort().join('|')
          coPurchaseFreq[pair] = (coPurchaseFreq[pair] || 0) + 1
        }
      }
    })

    // Store recommendations
    const recommendations = []
    for (const [pair, frequency] of Object.entries(coPurchaseFreq)) {
      const [sourceId, targetId] = pair.split('|')
      
      recommendations.push({
        tenant_id: this.tenantId,
        recommendation_type: 'customers_also_bought',
        source_product_id: sourceId,
        recommended_product_id: targetId,
        score: frequency,
        created_at: new Date().toISOString()
      })

      // Also add the reverse recommendation
      recommendations.push({
        tenant_id: this.tenantId,
        recommendation_type: 'customers_also_bought',
        source_product_id: targetId,
        recommended_product_id: sourceId,
        score: frequency,
        created_at: new Date().toISOString()
      })
    }

    if (recommendations.length > 0) {
      await supabase
        .from('product_recommendations')
        .upsert(recommendations)
    }
  }

  private async updatePersonalizedRecommendations(customerId: string, purchasedProductIds: string[]): Promise<void> {
    // Simplified personalization - in production, this would use ML algorithms
    // For now, recommend products from the same categories as purchased items
    
    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', purchasedProductIds)
      .eq('tenant_id', this.tenantId)

    if (!products) return

    const categoryIds = [...new Set(products.map(p => p.category_id))]
    
    // Find other products in these categories
    const { data: relatedProducts } = await supabase
      .from('products')
      .select('id')
      .in('category_id', categoryIds)
      .eq('tenant_id', this.tenantId)
      .eq('active', true)
      .not('id', 'in', `(${purchasedProductIds.join(',')})`)
      .limit(20)

    if (!relatedProducts) return

    const personalizedRecs = relatedProducts.map(product => ({
      tenant_id: this.tenantId,
      recommendation_type: 'personalized',
      recommended_product_id: product.id,
      customer_id: customerId,
      score: Math.random() * 100, // Placeholder scoring
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }))

    await supabase
      .from('product_recommendations')
      .upsert(personalizedRecs)
  }

  private async getCustomerProfile(customerId: string): Promise<any> {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (!customer) return null

      // Get customer stats
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total')
        .eq('customer_id', customerId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })

      const totalOrders = orders?.length || 0
      const lastOrderDate = orders?.[0]?.created_at || null

      // Get favorite category
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          products!inner(category_id, categories(name))
        `)
        .in('order_id', orders?.map(o => o.id) || [])

      const categoryCounts: { [category: string]: number } = {}
      orderItems?.forEach(item => {
        const categoryName = item.products?.categories?.name
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
        }
      })

      const favoriteCategory = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0]

      return {
        ...customer,
        total_orders: totalOrders,
        last_order_date: lastOrderDate,
        favorite_category: favoriteCategory
      }
    } catch (error) {
      console.error('Error fetching customer profile:', error)
      return null
    }
  }
}

// Singleton instance factory
export const createRecommendationEngine = (tenantId: string) => {
  return new RecommendationEngine(tenantId)
}
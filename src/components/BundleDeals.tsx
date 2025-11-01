import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { 
  Gift, 
  Fire, 
  Clock, 
  ShoppingCart, 
  Plus,
  Heart,
  Tag,
  Sparkle,
  Star,
  TrendUp
} from '@phosphor-icons/react'

interface BundleProduct {
  id: string
  name: string
  price: number
  originalPrice: number
  image?: string
  category: string
}

interface Bundle {
  id: string
  title: string
  description: string
  products: BundleProduct[]
  originalTotal: number
  bundlePrice: number
  savings: number
  savingsPercentage: number
  category: 'seasonal' | 'combo' | 'bulk' | 'starter' | 'premium'
  validUntil?: string
  popularity?: number
  isHot?: boolean
  isLimited?: boolean
  remainingQuantity?: number
  totalQuantity?: number
}

const sampleBundles: Bundle[] = [
  {
    id: 'winter-care',
    title: 'Winter Health Care Bundle',
    description: 'Complete protection against cold and flu',
    products: [
      { id: 'prod1', name: 'Vitamin C Tablets', price: 89, originalPrice: 120, category: 'vitamins' },
      { id: 'prod2', name: 'Immunity Booster Syrup', price: 145, originalPrice: 180, category: 'syrups' },
      { id: 'prod3', name: 'Throat Lozenges', price: 35, originalPrice: 45, category: 'otc' }
    ],
    originalTotal: 345,
    bundlePrice: 249,
    savings: 96,
    savingsPercentage: 28,
    category: 'seasonal',
    validUntil: '2024-03-31',
    popularity: 85,
    isHot: true
  },
  {
    id: 'diabetes-care',
    title: 'Diabetes Management Starter Kit',
    description: 'Essential supplies for diabetes monitoring and care',
    products: [
      { id: 'prod4', name: 'Glucometer with strips', price: 899, originalPrice: 1200, category: 'medical-devices' },
      { id: 'prod5', name: 'Lancets (100 pcs)', price: 199, originalPrice: 250, category: 'medical-supplies' },
      { id: 'prod6', name: 'Glucose Control Solution', price: 149, originalPrice: 180, category: 'solutions' }
    ],
    originalTotal: 1630,
    bundlePrice: 1199,
    savings: 431,
    savingsPercentage: 26,
    category: 'starter',
    popularity: 92,
    isLimited: true,
    remainingQuantity: 12,
    totalQuantity: 50
  },
  {
    id: 'baby-care',
    title: 'New Mom & Baby Care Bundle',
    description: 'Everything needed for newborn and mother care',
    products: [
      { id: 'prod7', name: 'Baby Diapers (Medium)', price: 299, originalPrice: 350, category: 'baby-care' },
      { id: 'prod8', name: 'Baby Wipes (3 packs)', price: 199, originalPrice: 240, category: 'baby-care' },
      { id: 'prod9', name: 'Nipple Cream', price: 189, originalPrice: 220, category: 'mother-care' },
      { id: 'prod10', name: 'Baby Oil', price: 89, originalPrice: 110, category: 'baby-care' }
    ],
    originalTotal: 920,
    bundlePrice: 699,
    savings: 221,
    savingsPercentage: 24,
    category: 'combo',
    popularity: 78,
    isHot: true
  },
  {
    id: 'skincare-routine',
    title: 'Complete Skincare Routine',
    description: 'Morning to night skincare essentials',
    products: [
      { id: 'prod11', name: 'Face Wash', price: 149, originalPrice: 180, category: 'skincare' },
      { id: 'prod12', name: 'Moisturizer', price: 299, originalPrice: 350, category: 'skincare' },
      { id: 'prod13', name: 'Sunscreen SPF 50', price: 349, originalPrice: 420, category: 'skincare' },
      { id: 'prod14', name: 'Night Serum', price: 599, originalPrice: 750, category: 'skincare' }
    ],
    originalTotal: 1700,
    bundlePrice: 1299,
    savings: 401,
    savingsPercentage: 24,
    category: 'premium',
    popularity: 67
  },
  {
    id: 'family-health',
    title: 'Family Health Essentials',
    description: 'Must-have medicines for every household',
    products: [
      { id: 'prod15', name: 'Paracetamol (20 tablets)', price: 45, originalPrice: 60, category: 'medicines' },
      { id: 'prod16', name: 'Antiseptic Solution', price: 89, originalPrice: 110, category: 'antiseptics' },
      { id: 'prod17', name: 'Band-aids (10 pcs)', price: 35, originalPrice: 45, category: 'first-aid' },
      { id: 'prod18', name: 'Thermometer', price: 299, originalPrice: 380, category: 'medical-devices' },
      { id: 'prod19', name: 'Cotton Swabs', price: 25, originalPrice: 35, category: 'medical-supplies' }
    ],
    originalTotal: 630,
    bundlePrice: 449,
    savings: 181,
    savingsPercentage: 29,
    category: 'bulk',
    popularity: 95,
    isHot: true
  }
]

interface BundleDealsProps {
  onAddToCart: (products: BundleProduct[], bundleInfo: { title: string; savings: number }) => void
  onAddToWishlist?: (bundle: Bundle) => void
}

export const BundleDeals: React.FC<BundleDealsProps> = ({ onAddToCart, onAddToWishlist }) => {
  const [bundles] = useKV<Bundle[]>('bundle-deals', sampleBundles)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    { key: 'seasonal', label: 'Seasonal', icon: '🍂' },
    { key: 'combo', label: 'Combo Deals', icon: '🎯' },
    { key: 'bulk', label: 'Bulk Savings', icon: '📦' },
    { key: 'starter', label: 'Starter Kits', icon: '🎁' },
    { key: 'premium', label: 'Premium Care', icon: '👑' }
  ]

  const filteredBundles = selectedCategory 
    ? bundles?.filter(bundle => bundle.category === selectedCategory) || []
    : bundles || []

  const handleAddToCart = (bundle: Bundle) => {
    onAddToCart(bundle.products, {
      title: bundle.title,
      savings: bundle.savings
    })
    toast.success(`Added ${bundle.title} to cart!`, {
      description: `You saved ₹${bundle.savings} with this bundle`
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seasonal': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'combo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'bulk': return 'bg-green-100 text-green-800 border-green-200'
      case 'starter': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTimeLeft = (validUntil: string) => {
    const now = new Date()
    const end = new Date(validUntil)
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days left` : 'Expired'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Gift className="w-6 h-6 text-orange-500" />
          Bundle Deals & Offers
        </h2>
        <p className="text-muted-foreground">
          Save more with our carefully curated product bundles
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2"
        >
          <Sparkle className="w-4 h-4" />
          All Deals
        </Button>
        {categories.map(category => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.key)}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>

      {/* Bundle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBundles.map((bundle) => (
          <Card key={bundle.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
            {/* Hot/Limited Badges */}
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              {bundle.isHot && (
                <Badge className="bg-red-500 text-white flex items-center gap-1 animate-pulse">
                  <Fire className="w-3 h-3" />
                  Hot Deal
                </Badge>
              )}
              {bundle.isLimited && (
                <Badge className="bg-orange-500 text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Limited
                </Badge>
              )}
            </div>

            {/* Popularity Badge */}
            {bundle.popularity && bundle.popularity > 80 && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-purple-500 text-white flex items-center gap-1">
                  <TrendUp className="w-3 h-3" />
                  {bundle.popularity}%
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className={getCategoryColor(bundle.category)} variant="outline">
                    {categories.find(c => c.key === bundle.category)?.label}
                  </Badge>
                  <CardTitle className="mt-2 group-hover:text-primary transition-colors">
                    {bundle.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bundle.description}
                  </p>
                </div>
              </div>

              {/* Stock Progress for Limited Items */}
              {bundle.isLimited && bundle.remainingQuantity && bundle.totalQuantity && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Only {bundle.remainingQuantity} left</span>
                    <span>{Math.round((bundle.remainingQuantity / bundle.totalQuantity) * 100)}% remaining</span>
                  </div>
                  <Progress 
                    value={(bundle.remainingQuantity / bundle.totalQuantity) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Validity Timer */}
              {bundle.validUntil && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeLeft(bundle.validUntil)}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Products List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Includes:</h4>
                <div className="space-y-1">
                  {bundle.products.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span className="flex-1 truncate">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through text-xs">
                          ₹{product.originalPrice}
                        </span>
                        <span className="font-semibold">₹{product.price}</span>
                      </div>
                    </div>
                  ))}
                  {bundle.products.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      + {bundle.products.length - 3} more items
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Regular Price:</span>
                  <span className="text-sm line-through">₹{bundle.originalTotal}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Bundle Price:</span>
                  <span className="text-xl font-bold text-primary">₹{bundle.bundlePrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-600">You Save:</span>
                  <div className="text-right">
                    <span className="text-green-600 font-bold">₹{bundle.savings}</span>
                    <span className="text-xs text-green-600 ml-1">
                      ({bundle.savingsPercentage}% OFF)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAddToCart(bundle)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Bundle
                </Button>
                {onAddToWishlist && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddToWishlist(bundle)}
                    className="px-3"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredBundles.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bundles found</h3>
          <p className="text-muted-foreground">
            Try selecting a different category or check back later for new deals
          </p>
        </div>
      )}
    </div>
  )
}
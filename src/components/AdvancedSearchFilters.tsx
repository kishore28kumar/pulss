import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Search,
  X,
  Filter,
  Tag,
  Package,
  Heart,
  Star,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  DollarSign,
  Sparkles
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { Product, FeatureFlags } from '@/types'
import { useAuth } from '@/lib/useAuth'
import { useKV } from '@github/spark/hooks'
import { motion, AnimatePresence } from 'framer-motion'

interface AdvancedSearchFiltersProps {
  tenantId: string
  businessType: 'pharmacy' | 'grocery' | 'general'
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: (query: string, filters: SearchFilters) => void
}

export interface SearchFilters {
  query: string
  category: string[]
  brands: string[]
  priceRange: [number, number]
  inStockOnly: boolean
  requiresPrescription: 'all' | 'prescription' | 'otc'
  packSize: string[]
  conditions: string[] // Pharmacy-specific
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'name' | 'popularity'
  fastDelivery: boolean
}

const defaultFilters: SearchFilters = {
  query: '',
  category: [],
  brands: [],
  priceRange: [0, 10000],
  inStockOnly: false,
  requiresPrescription: 'all',
  packSize: [],
  conditions: [],
  sortBy: 'relevance',
  fastDelivery: false
}

// Common medical conditions for pharmacy
const MEDICAL_CONDITIONS = [
  'Headache', 'Fever', 'Cold & Flu', 'Cough', 'Stomach Pain', 'Acidity',
  'Diabetes', 'Blood Pressure', 'Heart Disease', 'Arthritis', 'Skin Problems',
  'Eye Care', 'Hair Care', 'Dental Care', 'Women\'s Health', 'Men\'s Health',
  'Child Care', 'Elderly Care', 'Vitamins & Supplements', 'Weight Management'
]

// Auto-suggest terms with typo corrections
const SEARCH_SUGGESTIONS = {
  pharmacy: [
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'metformin',
    'losartan', 'atorvastatin', 'omeprazole', 'cetirizine', 'pantoprazole',
    'insulin', 'antibiotics', 'painkillers', 'vitamins', 'supplements'
  ],
  grocery: [
    'milk', 'bread', 'rice', 'oil', 'sugar', 'tea', 'coffee', 'fruits',
    'vegetables', 'snacks', 'beverages', 'spices', 'cleaning', 'personal care'
  ],
  general: [
    'electronics', 'clothing', 'books', 'home', 'garden', 'sports', 'toys'
  ]
}

// Typo correction mapping
const TYPO_CORRECTIONS: { [key: string]: string } = {
  'paracetmol': 'paracetamol',
  'ibuprofin': 'ibuprofen',
  'aspirn': 'aspirin',
  'amoxicilin': 'amoxicillin',
  'antibiotcs': 'antibiotics',
  'vitaimns': 'vitamins',
  'supplemnts': 'supplements'
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  tenantId,
  businessType,
  onFiltersChange,
  onSearch
}) => {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; count: number }>>([])
  const [brands, setBrands] = useState<string[]>([])
  const [packSizes, setPackSizes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [recentSearches, setRecentSearches] = useKV<string[]>('recent-searches', [])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)

  useEffect(() => {
    loadFeatureFlags()
    loadFilterOptions()
  }, [tenantId])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

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

  const loadFilterOptions = async () => {
    try {
      // Load categories with product counts
      const { data: categoryData } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          products(count)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const categoriesWithCounts = categoryData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat.products?.[0]?.count || 0
      })) || []

      setCategories(categoriesWithCounts)

      // Load brands
      const { data: products } = await supabase
        .from('products')
        .select('brand')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .not('brand', 'is', null)

      const uniqueBrands = [...new Set(products?.map(p => p.brand).filter(Boolean))] as string[]
      setBrands(uniqueBrands.sort())

      // Load pack sizes
      const { data: packSizeData } = await supabase
        .from('products')
        .select('pack_size')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .not('pack_size', 'is', null)

      const uniquePackSizes = [...new Set(packSizeData?.map(p => p.pack_size).filter(Boolean))] as string[]
      setPackSizes(uniquePackSizes.sort())

      // Calculate price range
      const { data: priceData } = await supabase
        .from('products')
        .select('price')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('price', { ascending: true })

      if (priceData && priceData.length > 0) {
        const minPrice = Math.floor(priceData[0].price)
        const maxPrice = Math.ceil(priceData[priceData.length - 1].price)
        setPriceRange([minPrice, maxPrice])
        setFilters(prev => ({ ...prev, priceRange: [minPrice, maxPrice] }))
      }
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }

  const handleSearch = (query: string) => {
    const correctedQuery = correctTypos(query)
    if (correctedQuery !== query) {
      setSearchQuery(correctedQuery)
      setFilters(prev => ({ ...prev, query: correctedQuery }))
    } else {
      setFilters(prev => ({ ...prev, query }))
    }

    // Save to recent searches
    if (query.trim()) {
      setRecentSearches(prev => {
        const searches = prev || []
        const newSearches = [query, ...searches.filter(s => s !== query)].slice(0, 5)
        return newSearches
      })
    }

    onSearch(correctedQuery || query, filters)
    setShowSuggestions(false)
  }

  const correctTypos = (query: string): string => {
    const words = query.toLowerCase().split(' ')
    const correctedWords = words.map(word => TYPO_CORRECTIONS[word] || word)
    return correctedWords.join(' ')
  }

  const generateSuggestions = (query: string): string[] => {
    if (!query.trim()) return []

    const searchTerms = SEARCH_SUGGESTIONS[businessType] || SEARCH_SUGGESTIONS.general
    const filtered = searchTerms.filter(term => 
      term.toLowerCase().includes(query.toLowerCase())
    )

    // Add condition-based suggestions for pharmacy
    if (businessType === 'pharmacy') {
      const conditionSuggestions = MEDICAL_CONDITIONS.filter(condition =>
        condition.toLowerCase().includes(query.toLowerCase())
      )
      filtered.push(...conditionSuggestions)
    }

    return filtered.slice(0, 8)
  }

  const handleQueryChange = (query: string) => {
    setSearchQuery(query)
    const suggestions = generateSuggestions(query)
    setSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleFilter = (filterType: 'category' | 'brands' | 'packSize' | 'conditions', value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      return { ...prev, [filterType]: newValues }
    })
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setSearchQuery('')
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.category.length > 0) count++
    if (filters.brands.length > 0) count++
    if (filters.inStockOnly) count++
    if (filters.requiresPrescription !== 'all') count++
    if (filters.packSize.length > 0) count++
    if (filters.conditions.length > 0) count++
    if (filters.fastDelivery) count++
    return count
  }, [filters])

  if (!featureFlags?.advanced_search_enabled) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${businessType === 'pharmacy' ? 'medicines, symptoms, conditions...' : 'products...'}`}
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="pl-10 pr-12 py-3 text-base"
          />
          <Button
            onClick={() => handleSearch(searchQuery)}
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            Search
          </Button>
        </div>

        {/* Auto-suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50"
            >
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion)
                      handleSearch(suggestion)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    <Search className="inline h-4 w-4 mr-2 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Searches */}
        {!showSuggestions && recentSearches && recentSearches.length > 0 && searchQuery === '' && (
          <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50">
            <div className="p-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent Searches</p>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search)
                      handleSearch(search)
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
            Clear All
            <X className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Categories</label>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={filters.category.includes(category.id)}
                              onCheckedChange={() => toggleFilter('category', category.id)}
                            />
                            <label htmlFor={`category-${category.id}`} className="text-sm">
                              {category.name}
                            </label>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {category.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  max={priceRange[1]}
                  min={priceRange[0]}
                  step={10}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Brands</label>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={filters.brands.includes(brand)}
                            onCheckedChange={() => toggleFilter('brands', brand)}
                          />
                          <label htmlFor={`brand-${brand}`} className="text-sm">
                            {brand}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Pharmacy-specific filters */}
              {businessType === 'pharmacy' && (
                <>
                  {/* Prescription Requirement */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Prescription</label>
                    <Select
                      value={filters.requiresPrescription}
                      onValueChange={(value) => updateFilter('requiresPrescription', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="prescription">Prescription Required</SelectItem>
                        <SelectItem value="otc">Over-the-Counter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Medical Conditions */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Conditions & Symptoms</label>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {MEDICAL_CONDITIONS.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <Checkbox
                              id={`condition-${condition}`}
                              checked={filters.conditions.includes(condition)}
                              onCheckedChange={() => toggleFilter('conditions', condition)}
                            />
                            <label htmlFor={`condition-${condition}`} className="text-sm">
                              {condition}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Separator />
                </>
              )}

              {/* Pack Size */}
              {packSizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">Pack Size</label>
                  <div className="flex flex-wrap gap-2">
                    {packSizes.map((size) => (
                      <Badge
                        key={size}
                        variant={filters.packSize.includes(size) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('packSize', size)}
                      >
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Additional Filters */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) => updateFilter('inStockOnly', checked)}
                  />
                  <label htmlFor="in-stock" className="text-sm">
                    In Stock Only
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fast-delivery"
                    checked={filters.fastDelivery}
                    onCheckedChange={(checked) => updateFilter('fastDelivery', checked)}
                  />
                  <label htmlFor="fast-delivery" className="text-sm">
                    Fast Delivery Available
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category.map(catId => {
            const category = categories.find(c => c.id === catId)
            return category ? (
              <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                {category.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleFilter('category', catId)}
                />
              </Badge>
            ) : null
          })}
          
          {filters.brands.map(brand => (
            <Badge key={brand} variant="secondary" className="flex items-center gap-1">
              {brand}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleFilter('brands', brand)}
              />
            </Badge>
          ))}

          {filters.conditions.map(condition => (
            <Badge key={condition} variant="secondary" className="flex items-center gap-1">
              {condition}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleFilter('conditions', condition)}
              />
            </Badge>
          ))}

          {filters.inStockOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              In Stock
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('inStockOnly', false)}
              />
            </Badge>
          )}

          {filters.requiresPrescription !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.requiresPrescription === 'prescription' ? 'Rx Required' : 'OTC Only'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('requiresPrescription', 'all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedSearchFilters
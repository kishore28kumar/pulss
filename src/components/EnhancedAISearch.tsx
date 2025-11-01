import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { MagnifyingGlass, Microphone, X, Sparkle, Clock, Pill, Heart, User } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SearchResult {
  products: Array<{
    id: string
    name: string
    description: string
    price: number
    mrp: number
    brand: string
    category: string
    requires_rx: boolean
    image_url: string
    match_reason: string
    relevance_score: number
  }>
  suggestions: string[]
  total_count: number
  search_type: 'product' | 'symptom' | 'condition' | 'category'
  ai_explanation?: string
}

interface EnhancedAISearchProps {
  onResults: (results: SearchResult) => void
  onClose?: () => void
  placeholder?: string
  businessType?: 'pharmacy' | 'grocery' | 'general'
}

export const EnhancedAISearch: React.FC<EnhancedAISearchProps> = ({
  onResults,
  onClose,
  placeholder,
  businessType = 'pharmacy'
}) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Popular search suggestions based on business type
  const getPopularSearches = () => {
    switch (businessType) {
      case 'pharmacy':
        return [
          'headache medicine',
          'fever tablets',
          'cough syrup',
          'diabetes medicine',
          'blood pressure',
          'vitamins',
          'pain relief',
          'antibiotics'
        ]
      case 'grocery':
        return [
          'rice',
          'cooking oil',
          'vegetables',
          'fruits',
          'dairy products',
          'snacks',
          'beverages',
          'spices'
        ]
      default:
        return [
          'electronics',
          'clothing',
          'home appliances',
          'books',
          'beauty products',
          'sports equipment'
        ]
    }
  }

  const [popularSearches] = useState(getPopularSearches())

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        setIsListening(false)
        handleSearch(transcript)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        toast.error('Voice recognition failed. Please try again.')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Load recent searches
    const saved = localStorage.getItem('recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent_searches', JSON.stringify(updated))
  }

  const startVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.error('Voice search is not supported in your browser')
      return
    }

    setIsListening(true)
    recognitionRef.current.start()
  }

  const performAISearch = async (searchQuery: string): Promise<SearchResult> => {
    // Use the global spark.llm for AI-powered search
    const prompt = spark.llmPrompt`
You are a smart search assistant for a ${businessType} store. 

Search Query: "${searchQuery}"

Based on this query, provide a JSON response with search analysis:
- Determine if this is a product name search, symptom search, or category search
- Suggest related search terms
- Provide explanation of what the user might be looking for

Return JSON format:
{
  "search_type": "product|symptom|condition|category",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "suggestions": ["suggestion1", "suggestion2"],
  "ai_explanation": "Brief explanation of what user is looking for",
  "category_hints": ["category1", "category2"]
}
`

    try {
      const aiResponse = await spark.llm(prompt, 'gpt-4o-mini', true)
      const analysis = JSON.parse(aiResponse)
      
      // Now search products in database using the AI analysis
      const searchTerms = [searchQuery, ...analysis.keywords].join(' | ')
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          mrp,
          brand,
          image_url,
          requires_rx,
          categories (name)
        `)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .eq('active', true)
        .limit(20)

      if (error) throw error

      // Calculate relevance scores and add match reasons
      const processedProducts = (products || []).map(product => {
        let relevanceScore = 0
        let matchReason = ''

        const queryLower = searchQuery.toLowerCase()
        const nameLower = product.name.toLowerCase()
        const descLower = (product.description || '').toLowerCase()
        const brandLower = (product.brand || '').toLowerCase()

        // Score based on matches
        if (nameLower.includes(queryLower)) {
          relevanceScore += 100
          matchReason = 'Name match'
        } else if (brandLower.includes(queryLower)) {
          relevanceScore += 80
          matchReason = 'Brand match'
        } else if (descLower.includes(queryLower)) {
          relevanceScore += 60
          matchReason = 'Description match'
        } else {
          relevanceScore += 30
          matchReason = 'Category match'
        }

        // Boost score for exact matches
        if (nameLower === queryLower) relevanceScore += 50

        return {
          ...product,
          category: (product.categories as any)?.name || 'General',
          match_reason: matchReason,
          relevance_score: relevanceScore
        }
      }).sort((a, b) => b.relevance_score - a.relevance_score)

      return {
        products: processedProducts,
        suggestions: analysis.suggestions || [],
        total_count: processedProducts.length,
        search_type: analysis.search_type || 'product',
        ai_explanation: analysis.ai_explanation
      }
    } catch (error) {
      console.error('AI search error:', error)
      
      // Fallback to simple database search
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          mrp,
          brand,
          image_url,
          requires_rx,
          categories (name)
        `)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
        .eq('active', true)
        .limit(20)

      if (dbError) throw dbError

      return {
        products: (products || []).map(p => ({
          ...p,
          category: (p.categories as any)?.name || 'General',
          match_reason: 'Text match',
          relevance_score: 50
        })),
        suggestions: [],
        total_count: products?.length || 0,
        search_type: 'product'
      }
    }
  }

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const results = await performAISearch(searchQuery.trim())
      onResults(results)
      saveRecentSearch(searchQuery.trim())
      
      if (results.products.length === 0) {
        toast.info('No exact matches found', {
          description: 'Try searching with different keywords or browse categories'
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    handleSearch(searchTerm)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent_searches')
  }

  const getPlaceholderText = () => {
    if (placeholder) return placeholder
    
    switch (businessType) {
      case 'pharmacy':
        return 'Search medicines, symptoms, or health conditions...'
      case 'grocery':
        return 'Search groceries, ingredients, or food items...'
      default:
        return 'Search products...'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 p-1 border-2 border-primary/20 rounded-xl bg-background shadow-lg focus-within:border-primary focus-within:shadow-xl transition-all">
          <div className="flex items-center gap-2 flex-1 px-3">
            <MagnifyingGlass className="h-5 w-5 text-primary flex-shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              placeholder={getPlaceholderText()}
              className="border-0 shadow-none focus-visible:ring-0 text-base bg-transparent"
              disabled={isSearching}
            />
            {query && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 pr-2">
            {recognitionRef.current && (
              <Button
                size="sm"
                variant={isListening ? "default" : "ghost"}
                onClick={startVoiceSearch}
                disabled={isSearching || isListening}
                className={`h-9 w-9 p-0 ${isListening ? 'animate-pulse' : ''}`}
                title="Voice search"
              >
                <Microphone className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="h-9 px-6 gap-2"
            >
              {isSearching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkle className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (
          <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-2">
            <CardContent className="p-4">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Searches
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearRecentSearches}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleQuickSearch(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  {businessType === 'pharmacy' && <Pill className="h-4 w-4" />}
                  {businessType === 'grocery' && <Heart className="h-4 w-4" />}
                  {businessType === 'general' && <User className="h-4 w-4" />}
                  Popular Searches
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {popularSearches.map((search, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickSearch(search)}
                      className="justify-start h-8 text-sm font-normal"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Tips */}
      {businessType === 'pharmacy' && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Try searching by medicine name, symptom, or condition (e.g., "headache", "diabetes medication")
          </p>
        </div>
      )}

      {/* Overlay to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
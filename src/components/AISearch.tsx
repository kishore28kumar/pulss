/**
 * AI-powered search component with voice recognition and smart suggestions
 * Supports natural language queries, symptom-based search, and barcode scanning
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MagnifyingGlass, Microphone, MicrophoneSlash, Camera, X, Sparkle, Clock, TrendUp } from '@phosphor-icons/react'
import { aiSearchService, type SearchResult, type Product } from '@/lib/aiSearch'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'

interface AISearchProps {
  onResults: (results: SearchResult) => void
  onLoading: (loading: boolean) => void
  tenantId?: string
  businessType?: 'pharmacy' | 'grocery' | 'general'
  className?: string
}

interface SearchHistory {
  query: string
  timestamp: number
  results: number
}

export const AISearch: React.FC<AISearchProps> = ({
  onResults,
  onLoading,
  tenantId,
  businessType = 'pharmacy',
  className = ''
}) => {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useKV<SearchHistory[]>('search-history', [])
  const [trendingSearches] = useKV<string[]>('trending-searches', [])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const recognition = useRef<any>(null)
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch products for search
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      if (!tenantId) return []
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          category,
          brand,
          price,
          requires_rx,
          uses,
          symptoms,
          tags
        `)
        .eq('tenant_id', tenantId)
        .eq('active', true)

      if (error) throw error
      return data || []
    },
    enabled: !!tenantId
  })

  // Search placeholder text based on business type
  const getPlaceholder = () => {
    switch (businessType) {
      case 'pharmacy':
        return 'Search medicines, symptoms, or health products...'
      case 'grocery':
        return 'Search groceries, vegetables, or food items...'
      default:
        return 'Search products...'
    }
  }

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setQuery(transcript)
        performSearch(transcript)
        setIsListening(false)
      }

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        toast.error('Voice search failed. Please try again.')
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onResults({ products: [], suggestions: [], categories: [], confidence: 0 })
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    onLoading(true)

    try {
      const results = await aiSearchService.searchProducts(searchQuery.trim(), products)
      onResults(results)
      
      // Update search history
      const newHistoryItem: SearchHistory = {
        query: searchQuery.trim(),
        timestamp: Date.now(),
        results: results.products.length
      }
      
      setSearchHistory(current => {
        const currentHistory = current || []
        const filtered = currentHistory.filter(item => item.query !== searchQuery.trim())
        return [newHistoryItem, ...filtered].slice(0, 10) // Keep last 10 searches
      })

      setShowSuggestions(true)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
      onLoading(false)
    }
  }, [products, onResults, onLoading, setSearchHistory])

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedSuggestion(-1)

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    // Debounce search
    searchTimeout.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
    performSearch(query)
  }

  // Start voice search
  const startVoiceSearch = () => {
    if (!recognition.current) {
      toast.error('Voice search is not supported in this browser')
      return
    }

    try {
      setIsListening(true)
      recognition.current.start()
    } catch (error) {
      console.error('Voice search failed:', error)
      setIsListening(false)
      toast.error('Voice search failed. Please try again.')
    }
  }

  // Stop voice search
  const stopVoiceSearch = () => {
    if (recognition.current) {
      recognition.current.stop()
    }
    setIsListening(false)
  }

  // Handle barcode scanning (placeholder for future implementation)
  const handleBarcodeScan = () => {
    toast.info('Barcode scanning feature coming soon!')
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
    setShowSuggestions(false)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    const suggestions = [
      ...(searchHistory?.map(h => h.query) || []),
      ...(trendingSearches || [])
    ]
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        if (selectedSuggestion >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedSuggestion])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        break
    }
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    onResults({ products: [], suggestions: [], categories: [], confidence: 0 })
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const recentSearches = (searchHistory || []).slice(0, 5)
  const displayedTrending = (trendingSearches || []).slice(0, 5)

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          
          <Input
            ref={searchInputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={getPlaceholder()}
            className="pl-10 pr-24 h-12 text-base border-2 focus:border-primary transition-colors"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-secondary"
              >
                <X size={16} />
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={isListening ? stopVoiceSearch : startVoiceSearch}
              className={`h-8 w-8 p-0 ${isListening ? 'text-red-500 animate-pulse' : 'hover:bg-secondary'}`}
              disabled={!recognition.current}
            >
              {isListening ? <MicrophoneSlash size={16} /> : <Microphone size={16} />}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBarcodeScan}
              className="h-8 w-8 p-0 hover:bg-secondary"
            >
              <Camera size={16} />
            </Button>
          </div>
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (recentSearches.length > 0 || displayedTrending.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 border shadow-lg bg-background">
          <CardContent className="p-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Recent</span>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((item, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handleSuggestionClick(item.query)}
                      className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-accent transition-colors ${
                        selectedSuggestion === index ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.query}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.results}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            {displayedTrending.length > 0 && (
              <>
                {recentSearches.length > 0 && <Separator className="mb-4" />}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendUp size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Trending</span>
                  </div>
                  <div className="space-y-1">
                    {displayedTrending.map((trend, index) => {
                      const adjustedIndex = recentSearches.length + index
                      return (
                        <button
                          key={`trending-${index}`}
                          onClick={() => handleSuggestionClick(trend)}
                          className={`w-full text-left px-2 py-1 rounded text-sm hover:bg-accent transition-colors ${
                            selectedSuggestion === adjustedIndex ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkle size={12} className="text-amber-500" />
                            <span>{trend}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Loading Indicator */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 z-40 mt-2">
          <Card className="border shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  AI is analyzing your search...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AISearch
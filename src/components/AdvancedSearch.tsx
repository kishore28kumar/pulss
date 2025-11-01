import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MagnifyingGlass, Microphone, X, Sparkle } from '@phosphor-icons/react'

interface AdvancedSearchProps {
  onSearch: (query: string, filters?: any) => void
  placeholder?: string
  enableVoice?: boolean
  enableTypoCorrection?: boolean
}

// Levenshtein distance for typo correction
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Common medicine names and health terms for autocorrection
const commonTerms = [
  'paracetamol', 'aspirin', 'ibuprofen', 'amoxicillin', 'azithromycin',
  'metformin', 'insulin', 'atorvastatin', 'omeprazole', 'losartan',
  'headache', 'fever', 'cough', 'cold', 'diabetes', 'hypertension',
  'pain', 'infection', 'allergy', 'vitamin', 'supplement'
]

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  placeholder = 'Search medicines, health conditions...',
  enableVoice = true,
  enableTypoCorrection = true
}) => {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Typo correction
  useEffect(() => {
    if (!enableTypoCorrection || query.length < 3) {
      setTypoSuggestion(null)
      return
    }

    const queryLower = query.toLowerCase().trim()
    let bestMatch: string | null = null
    let bestDistance = Infinity

    for (const term of commonTerms) {
      const distance = levenshteinDistance(queryLower, term)
      
      // If distance is small and better than previous matches
      if (distance > 0 && distance < 3 && distance < bestDistance) {
        bestDistance = distance
        bestMatch = term
      }
    }

    setTypoSuggestion(bestMatch)
  }, [query, enableTypoCorrection])

  // Auto-suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const queryLower = query.toLowerCase()
    const matches = commonTerms
      .filter(term => term.toLowerCase().includes(queryLower))
      .slice(0, 5)

    setSuggestions(matches)
  }, [query])

  // Voice search
  const startVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      onSearch(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [onSearch])

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  return (
    <div className="relative w-full">
      {/* Typo suggestion */}
      {typoSuggestion && (
        <Card className="absolute -top-12 left-0 right-0 p-2 bg-yellow-50 border-yellow-200 flex items-center gap-2 text-sm">
          <Sparkle className="w-4 h-4 text-yellow-600" />
          <span>Did you mean:</span>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-blue-600"
            onClick={() => {
              setQuery(typoSuggestion)
              handleSearch(typoSuggestion)
            }}
          >
            {typoSuggestion}
          </Button>
        </Card>
      )}

      {/* Search input */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSuggestions([])
                setTypoSuggestion(null)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {enableVoice && (
          <Button
            variant="outline"
            size="icon"
            onClick={startVoiceSearch}
            disabled={isListening}
            className={isListening ? 'animate-pulse bg-red-50' : ''}
          >
            <Microphone className={`w-5 h-5 ${isListening ? 'text-red-600' : ''}`} />
          </Button>
        )}

        <Button onClick={() => handleSearch()}>
          Search
        </Button>
      </div>

      {/* Auto-suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full mt-2 left-0 right-0 z-50 p-2 shadow-lg">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <MagnifyingGlass className="w-4 h-4 text-gray-400" />
                <span className="capitalize">{suggestion}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

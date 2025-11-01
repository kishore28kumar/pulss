/**
 * AI-powered search service for intelligent product discovery
 * Supports natural language queries, symptom-based search, and smart categorization
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../types/spark.d.ts" />

export interface Product {
  id: string
  name: string
  description?: string
  category: string
  brand?: string
  uses?: string
  symptoms?: string
  price: number
  requires_rx: boolean
  tags?: string[]
}

export interface SearchResult {
  products: Product[]
  suggestions: string[]
  categories: string[]
  confidence: number
}

class AISearchService {
  private static instance: AISearchService
  private searchCache = new Map<string, SearchResult>()

  public static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService()
    }
    return AISearchService.instance
  }

  /**
   * Intelligent search that understands natural language queries
   */
  async searchProducts(query: string, products: Product[]): Promise<SearchResult> {
    const normalizedQuery = query.toLowerCase().trim()
    
    // Check cache first
    const cached = this.searchCache.get(normalizedQuery)
    if (cached) {
      return cached
    }

    try {
      // Use AI to understand the search intent
      const searchIntent = await this.analyzeSearchIntent(query)
      
      // Perform multi-stage search
      const results = this.performIntelligentSearch(searchIntent, products)
      
      // Cache the results
      this.searchCache.set(normalizedQuery, results)
      
      return results
    } catch (error) {
      console.error('AI search failed, falling back to basic search:', error)
      return this.performBasicSearch(query, products)
    }
  }

  /**
   * Analyze search intent using AI
   */
  private async analyzeSearchIntent(query: string): Promise<{
    intent: 'symptom' | 'product' | 'category' | 'brand' | 'general'
    keywords: string[]
    medicalTerms: string[]
    synonyms: string[]
    category: string
  }> {
    const promptText = `Analyze this search query for an e-commerce platform: "${query}"
      
Determine:
1. Intent type (symptom, product, category, brand, general)
2. Key search terms
3. Medical terms or symptoms mentioned
4. Possible synonyms or alternative terms
5. Most likely product category

Return as JSON with the exact structure:
{
  "intent": "symptom|product|category|brand|general",
  "keywords": ["term1", "term2"],
  "medicalTerms": ["medical1", "medical2"],
  "synonyms": ["synonym1", "synonym2"],
  "category": "category_name"
}`

    try {
      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      return JSON.parse(response)
    } catch (error) {
      // Fallback analysis
      return this.basicIntentAnalysis(query)
    }
  }

  /**
   * Basic intent analysis fallback
   */
  private basicIntentAnalysis(query: string): any {
    const medicalKeywords = ['fever', 'headache', 'pain', 'cold', 'cough', 'diabetes', 'blood pressure', 'infection']
    const isMedical = medicalKeywords.some(keyword => query.toLowerCase().includes(keyword))
    
    return {
      intent: isMedical ? 'symptom' : 'product',
      keywords: query.split(' ').filter(word => word.length > 2),
      medicalTerms: isMedical ? [query] : [],
      synonyms: [],
      category: isMedical ? 'medicines' : 'general'
    }
  }

  /**
   * Perform intelligent search based on AI analysis
   */
  private performIntelligentSearch(intent: any, products: Product[]): SearchResult {
    const filteredProducts = [...products]
    let confidence = 0.5

    // Score products based on relevance
    const scoredProducts = filteredProducts.map(product => {
      let score = 0

      // Keyword matching
      intent.keywords.forEach((keyword: string) => {
        if (product.name.toLowerCase().includes(keyword.toLowerCase())) score += 3
        if (product.description?.toLowerCase().includes(keyword.toLowerCase())) score += 2
        if (product.category.toLowerCase().includes(keyword.toLowerCase())) score += 2
        if (product.brand?.toLowerCase().includes(keyword.toLowerCase())) score += 1
        if (product.uses?.toLowerCase().includes(keyword.toLowerCase())) score += 2
        if (product.tags?.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) score += 1
      })

      // Medical term matching for symptom searches
      if (intent.intent === 'symptom') {
        intent.medicalTerms.forEach((term: string) => {
          if (product.symptoms?.toLowerCase().includes(term.toLowerCase())) score += 4
          if (product.uses?.toLowerCase().includes(term.toLowerCase())) score += 3
        })
      }

      // Category matching
      if (product.category.toLowerCase() === intent.category.toLowerCase()) {
        score += 2
      }

      return { ...product, relevanceScore: score }
    })

    // Sort by relevance and filter out low scores
    const relevantProducts = scoredProducts
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50) // Limit results

    confidence = relevantProducts.length > 0 ? Math.min(relevantProducts[0].relevanceScore / 10, 1) : 0

    // Generate suggestions
    const suggestions = this.generateSuggestions(intent, products)
    
    // Extract categories from results
    const categories = [...new Set(relevantProducts.map(p => p.category))]

    return {
      products: relevantProducts,
      suggestions,
      categories,
      confidence
    }
  }

  /**
   * Perform basic search as fallback
   */
  private performBasicSearch(query: string, products: Product[]): SearchResult {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 1)
    
    const matchingProducts = products.filter(product => {
      return queryWords.some(word => 
        product.name.toLowerCase().includes(word) ||
        product.description?.toLowerCase().includes(word) ||
        product.category.toLowerCase().includes(word) ||
        product.brand?.toLowerCase().includes(word)
      )
    })

    return {
      products: matchingProducts.slice(0, 20),
      suggestions: [],
      categories: [...new Set(matchingProducts.map(p => p.category))],
      confidence: 0.3
    }
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(intent: any, products: Product[]): string[] {
    const suggestions: string[] = []

    // Add category-based suggestions
    if (intent.category) {
      const categoryProducts = products.filter(p => 
        p.category.toLowerCase().includes(intent.category.toLowerCase())
      )
      const popularBrands = [...new Set(categoryProducts.map(p => p.brand).filter(Boolean))]
      suggestions.push(...popularBrands.slice(0, 3).map(brand => `${brand} ${intent.category}`))
    }

    // Add symptom-based suggestions for medical searches
    if (intent.intent === 'symptom') {
      suggestions.push(
        'pain relief medicine',
        'fever reducer tablets',
        'cough syrup',
        'antibiotics'
      )
    }

    return suggestions.slice(0, 5)
  }

  /**
   * Smart categorization for CSV imports
   */
  async categorizeProduct(productName: string, description?: string): Promise<{
    category: string
    subcategory: string
    tags: string[]
    requires_rx: boolean
  }> {
    const promptText = `Categorize this product for an e-commerce platform:
Name: "${productName}"
Description: "${description || ''}"

Determine:
1. Main category (medicines, groceries, personal_care, baby_care, health_devices, etc.)
2. Subcategory (more specific classification)
3. Relevant tags for searchability
4. Whether it requires prescription (true/false)

Return as JSON:
{
  "category": "main_category",
  "subcategory": "specific_category", 
  "tags": ["tag1", "tag2", "tag3"],
  "requires_rx": false
}`

    try {
      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      return JSON.parse(response)
    } catch (error) {
      console.error('AI categorization failed:', error)
      return {
        category: 'general',
        subcategory: 'other',
        tags: [productName.toLowerCase()],
        requires_rx: false
      }
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear()
  }
}

export const aiSearchService = AISearchService.getInstance()
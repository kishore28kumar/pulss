import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Sparkle, Plus, PencilSimple, Trash, Download, Upload, Brain, MagnifyingGlass, Tag, Stethoscope } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AISearchMapping {
  id: string
  business_type: string
  search_term: string
  search_type: 'symptom' | 'condition' | 'category' | 'keyword'
  mapped_keywords: string[]
  confidence_score: number
  active: boolean
  created_at: string
  updated_at: string
}

interface SearchSuggestion {
  id: string
  business_type: string
  category: string
  suggestions: string[]
  display_order: number
  active: boolean
}

export const AISearchConfigurator: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('mappings')
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false)
  const [isAddSuggestionOpen, setIsAddSuggestionOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<AISearchMapping | null>(null)
  const [editingSuggestion, setEditingSuggestion] = useState<SearchSuggestion | null>(null)

  const [newMapping, setNewMapping] = useState({
    business_type: 'pharmacy',
    search_term: '',
    search_type: 'symptom' as 'symptom' | 'condition' | 'category' | 'keyword',
    mapped_keywords: [] as string[],
    confidence_score: 0.8
  })

  const [newSuggestion, setNewSuggestion] = useState({
    business_type: 'pharmacy',
    category: '',
    suggestions: [] as string[],
    display_order: 1
  })

  // Fetch AI search mappings
  const { data: mappings = [], isLoading: mappingsLoading } = useQuery({
    queryKey: ['ai-search-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_search_mappings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AISearchMapping[]
    }
  })

  // Fetch search suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_suggestions')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      return data as SearchSuggestion[]
    }
  })

  // Add/Update mapping mutation
  const mappingMutation = useMutation({
    mutationFn: async (mapping: Partial<AISearchMapping>) => {
      if (mapping.id) {
        const { data, error } = await supabase
          .from('ai_search_mappings')
          .update(mapping)
          .eq('id', mapping.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('ai_search_mappings')
          .insert([mapping])
          .select()
          .single()
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-search-mappings'] })
      setIsAddMappingOpen(false)
      setEditingMapping(null)
      resetNewMapping()
      toast.success('AI search mapping saved successfully')
    },
    onError: (error) => {
      console.error('Error saving mapping:', error)
      toast.error('Failed to save AI search mapping')
    }
  })

  // Add/Update suggestion mutation
  const suggestionMutation = useMutation({
    mutationFn: async (suggestion: Partial<SearchSuggestion>) => {
      if (suggestion.id) {
        const { data, error } = await supabase
          .from('search_suggestions')
          .update(suggestion)
          .eq('id', suggestion.id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('search_suggestions')
          .insert([suggestion])
          .select()
          .single()
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-suggestions'] })
      setIsAddSuggestionOpen(false)
      setEditingSuggestion(null)
      resetNewSuggestion()
      toast.success('Search suggestion saved successfully')
    },
    onError: (error) => {
      console.error('Error saving suggestion:', error)
      toast.error('Failed to save search suggestion')
    }
  })

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_search_mappings')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-search-mappings'] })
      toast.success('AI search mapping deleted')
    },
    onError: () => {
      toast.error('Failed to delete mapping')
    }
  })

  // Delete suggestion mutation
  const deleteSuggestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('search_suggestions')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-suggestions'] })
      toast.success('Search suggestion deleted')
    },
    onError: () => {
      toast.error('Failed to delete suggestion')
    }
  })

  const resetNewMapping = () => {
    setNewMapping({
      business_type: 'pharmacy',
      search_term: '',
      search_type: 'symptom',
      mapped_keywords: [],
      confidence_score: 0.8
    })
  }

  const resetNewSuggestion = () => {
    setNewSuggestion({
      business_type: 'pharmacy',
      category: '',
      suggestions: [],
      display_order: 1
    })
  }

  const handleEditMapping = (mapping: AISearchMapping) => {
    setEditingMapping(mapping)
    setNewMapping({
      business_type: mapping.business_type,
      search_term: mapping.search_term,
      search_type: mapping.search_type,
      mapped_keywords: mapping.mapped_keywords,
      confidence_score: mapping.confidence_score
    })
    setIsAddMappingOpen(true)
  }

  const handleEditSuggestion = (suggestion: SearchSuggestion) => {
    setEditingSuggestion(suggestion)
    setNewSuggestion({
      business_type: suggestion.business_type,
      category: suggestion.category,
      suggestions: suggestion.suggestions,
      display_order: suggestion.display_order
    })
    setIsAddSuggestionOpen(true)
  }

  const handleSaveMapping = () => {
    if (!newMapping.search_term || newMapping.mapped_keywords.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    mappingMutation.mutate({
      ...(editingMapping?.id && { id: editingMapping.id }),
      ...newMapping,
      active: true,
      updated_at: new Date().toISOString()
    })
  }

  const handleSaveSuggestion = () => {
    if (!newSuggestion.category || newSuggestion.suggestions.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    suggestionMutation.mutate({
      ...(editingSuggestion?.id && { id: editingSuggestion.id }),
      ...newSuggestion,
      active: true
    })
  }

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !newMapping.mapped_keywords.includes(keyword.trim())) {
      setNewMapping(prev => ({
        ...prev,
        mapped_keywords: [...prev.mapped_keywords, keyword.trim()]
      }))
    }
  }

  const removeKeyword = (index: number) => {
    setNewMapping(prev => ({
      ...prev,
      mapped_keywords: prev.mapped_keywords.filter((_, i) => i !== index)
    }))
  }

  const addSuggestion = (suggestion: string) => {
    if (suggestion.trim() && !newSuggestion.suggestions.includes(suggestion.trim())) {
      setNewSuggestion(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, suggestion.trim()]
      }))
    }
  }

  const removeSuggestion = (index: number) => {
    setNewSuggestion(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter((_, i) => i !== index)
    }))
  }

  // Export configurations
  const exportConfiguration = async () => {
    try {
      const exportData = {
        ai_search_mappings: mappings,
        search_suggestions: suggestions,
        exported_at: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-search-config-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('AI search configuration exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export configuration')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Search Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure intelligent search mappings and suggestions for different business types
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportConfiguration}>
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mappings">AI Mappings</TabsTrigger>
          <TabsTrigger value="suggestions">Search Suggestions</TabsTrigger>
          <TabsTrigger value="preview">Preview & Test</TabsTrigger>
        </TabsList>

        {/* AI Mappings Tab */}
        <TabsContent value="mappings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Search Mappings</h3>
              <p className="text-sm text-muted-foreground">
                Map symptoms, conditions, and keywords to relevant products
              </p>
            </div>
            <Dialog open={isAddMappingOpen} onOpenChange={setIsAddMappingOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetNewMapping(); setEditingMapping(null) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingMapping ? 'Edit AI Mapping' : 'Add AI Search Mapping'}
                  </DialogTitle>
                  <DialogDescription>
                    Create intelligent mappings between search terms and product keywords
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_type">Business Type</Label>
                      <Select 
                        value={newMapping.business_type} 
                        onValueChange={(value) => setNewMapping(prev => ({ ...prev, business_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="grocery">Grocery</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="general">General Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="search_type">Search Type</Label>
                      <Select 
                        value={newMapping.search_type} 
                      onValueChange={(value: 'symptom' | 'condition' | 'category' | 'keyword') => setNewMapping(prev => ({ ...prev, search_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="symptom">Symptom</SelectItem>
                          <SelectItem value="condition">Medical Condition</SelectItem>
                          <SelectItem value="category">Product Category</SelectItem>
                          <SelectItem value="keyword">General Keyword</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="search_term">Search Term</Label>
                    <Input
                      id="search_term"
                      value={newMapping.search_term}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, search_term: e.target.value }))}
                      placeholder="e.g., headache, fever, diabetes"
                    />
                  </div>

                  <div>
                    <Label>Mapped Keywords</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add keyword to map..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addKeyword(e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement
                            addKeyword(input.value)
                            input.value = ''
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newMapping.mapped_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {keyword}
                            <button
                              onClick={() => removeKeyword(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confidence_score">Confidence Score (0.1 - 1.0)</Label>
                    <Input
                      id="confidence_score"
                      type="number"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={newMapping.confidence_score}
                      onChange={(e) => setNewMapping(prev => ({ ...prev, confidence_score: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="outline" onClick={() => setIsAddMappingOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMapping} disabled={mappingMutation.isPending}>
                    {mappingMutation.isPending ? 'Saving...' : editingMapping ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Search Term</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell>
                        <Badge variant="outline">{mapping.business_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{mapping.search_term}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{mapping.search_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mapping.mapped_keywords.slice(0, 3).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {mapping.mapped_keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{mapping.mapped_keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{(mapping.confidence_score * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge variant={mapping.active ? 'default' : 'secondary'}>
                          {mapping.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMapping(mapping)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMappingMutation.mutate(mapping.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Search Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Configure popular search suggestions by business type and category
              </p>
            </div>
            <Dialog open={isAddSuggestionOpen} onOpenChange={setIsAddSuggestionOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetNewSuggestion(); setEditingSuggestion(null) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Suggestions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSuggestion ? 'Edit Search Suggestions' : 'Add Search Suggestions'}
                  </DialogTitle>
                  <DialogDescription>
                    Create popular search suggestions for customers
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_type">Business Type</Label>
                      <Select 
                        value={newSuggestion.business_type} 
                        onValueChange={(value) => setNewSuggestion(prev => ({ ...prev, business_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="grocery">Grocery</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="general">General Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        min="1"
                        value={newSuggestion.display_order}
                        onChange={(e) => setNewSuggestion(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category Name</Label>
                    <Input
                      id="category"
                      value={newSuggestion.category}
                      onChange={(e) => setNewSuggestion(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Popular Medicines, Trending Items"
                    />
                  </div>

                  <div>
                    <Label>Search Suggestions</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add search suggestion..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addSuggestion(e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement
                            addSuggestion(input.value)
                            input.value = ''
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newSuggestion.suggestions.map((suggestion, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {suggestion}
                            <button
                              onClick={() => removeSuggestion(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="outline" onClick={() => setIsAddSuggestionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSuggestion} disabled={suggestionMutation.isPending}>
                    {suggestionMutation.isPending ? 'Saving...' : editingSuggestion ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {suggestions.reduce((acc, suggestion) => {
              const existing = acc.find(s => s.business_type === suggestion.business_type)
              if (existing) {
                existing.items.push(suggestion)
              } else {
                acc.push({
                  business_type: suggestion.business_type,
                  items: [suggestion]
                })
              }
              return acc
            }, [] as { business_type: string; items: SearchSuggestion[] }[]).map((group) => (
              <Card key={group.business_type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {group.business_type === 'pharmacy' && <Stethoscope className="h-5 w-5" />}
                    {group.business_type === 'grocery' && <Tag className="h-5 w-5" />}
                    {group.business_type === 'fashion' && <Tag className="h-5 w-5" />}
                    {group.business_type === 'electronics' && <Tag className="h-5 w-5" />}
                    {group.business_type === 'general' && <Tag className="h-5 w-5" />}
                    {group.business_type.charAt(0).toUpperCase() + group.business_type.slice(1)} Store
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.items.map((suggestion) => (
                      <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{suggestion.category}</div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.suggestions.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Order: {suggestion.display_order}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSuggestion(suggestion)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSuggestionMutation.mutate(suggestion.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Preview & Test Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Search Preview</CardTitle>
              <CardDescription>
                Test how your AI search configurations work in practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select defaultValue="pharmacy">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="grocery">Grocery</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10" 
                      placeholder="Test AI search (e.g., headache, fever, diabetes)..." 
                    />
                  </div>
                  <Button>
                    <Sparkle className="h-4 w-4 mr-2" />
                    Test Search
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Enter a search term to see how AI mapping and suggestions work
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
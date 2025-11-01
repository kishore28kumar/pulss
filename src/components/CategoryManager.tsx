import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  DotsSixVertical,
  Package,
  Eye,
  EyeSlash,
  Image as ImageIcon
} from '@phosphor-icons/react'

// Common pharmacy category icons
const categoryIcons = [
  'pill', 'heart', 'sparkle', 'baby', 'device-mobile', 'leaf', 
  'first-aid-kit', 'syringe', 'thermometer', 'stethoscope',
  'bandaids', 'virus', 'tooth', 'eye', 'lungs', 'brain'
]

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  icon?: string
  display_order: number
  is_active: boolean
  parent_id?: string
  product_count?: number
}

interface CategoryManagerProps {
  tenantId: string
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ tenantId }) => {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '',
    parent_id: ''
  })

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          product_count:products(count)
        `)
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })
      
      if (error) throw error
      return data.map(cat => ({
        ...cat,
        product_count: cat.product_count?.[0]?.count || 0
      })) as Category[]
    }
  })

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0)
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          tenant_id: tenantId,
          display_order: maxOrder + 1
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      toast.success('Category created successfully')
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`)
    }
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      toast.success('Category updated successfully')
      setIsDialogOpen(false)
      setEditingCategory(null)
      resetForm()
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`)
    }
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`)
    }
  })

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_active })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
    }
  })

  const resetForm = () => {
    setNewCategory({
      name: '',
      description: '',
      icon: '',
      parent_id: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        ...newCategory
      })
    } else {
      createCategoryMutation.mutate(newCategory)
    }
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      parent_id: category.parent_id || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteCategoryMutation.mutate(categoryId)
    }
  }

  const getIconElement = (iconName: string) => {
    // In a real app, you'd map icon names to actual icons
    return iconName ? `📦` : '📦'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package />
            Category Management
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null)
                resetForm()
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription>
                    Create organized categories to help customers find products easily.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Medicines & Tablets"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this category"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={newCategory.icon}
                      onValueChange={(value) => setNewCategory(prev => ({ ...prev, icon: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryIcons.map(icon => (
                          <SelectItem key={icon} value={icon}>
                            <span className="flex items-center gap-2">
                              {getIconElement(icon)} {icon}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="parent">Parent Category (Optional)</Label>
                    <Select
                      value={newCategory.parent_id}
                      onValueChange={(value) => setNewCategory(prev => ({ ...prev, parent_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Top Level)</SelectItem>
                        {categories
                          .filter(cat => cat.id !== editingCategory?.id)
                          .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Organize your products into categories for easy browsing
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No categories yet. Create your first category to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(category => (
              <div 
                key={category.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  !category.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="cursor-grab">
                  <DotsSixVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getIconElement(category.icon || '')}</span>
                    <h4 className="font-medium">{category.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {category.product_count || 0} products
                    </Badge>
                    {!category.is_active && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({
                      id: category.id,
                      is_active: !category.is_active
                    })}
                  >
                    {category.is_active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeSlash className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(category)}
                  >
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={(category.product_count || 0) > 0}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
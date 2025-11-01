import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  PencilSimple,
  FloppyDisk,
  X,
  Tag,
  Percent,
  Package,
  Eye,
  EyeSlash
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProductImageEditor } from './ProductImageEditor'

interface Product {
  product_id: string
  name: string
  description?: string
  brand?: string
  pack_size?: string
  price: number
  mrp: number
  image_url?: string
  images?: string[]
  sku?: string
  tags?: string[]
  active: boolean
  featured: boolean
  inventory_count?: number
  offer_badge_text?: string
  offer_badge_visible?: boolean
  discount_percentage?: number
  is_bundle?: boolean
}

interface ProductCardEditorProps {
  product: Product
  tenantId: string
  onUpdate: (product: Product) => void
}

export const ProductCardEditor = ({ product, tenantId, onUpdate }: ProductCardEditorProps) => {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(product)
  const [newTag, setNewTag] = useState('')

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch(
        `/api/products/${product.product_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Update failed')
      }

      const data = await response.json()
      onUpdate(data.product)
      setEditing(false)
      
      toast.success('Product updated successfully')
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(product)
    setEditing(false)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove)
    })
  }

  const calculateDiscount = () => {
    if (formData.mrp && formData.price && formData.mrp > formData.price) {
      return Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)
    }
    return 0
  }

  const discount = calculateDiscount()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="font-semibold"
                />
              ) : (
                <span>{product.name}</span>
              )}
            </CardTitle>
            {!editing && product.sku && (
              <CardDescription className="mt-1">
                SKU: {product.sku}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <PencilSimple className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <FloppyDisk className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Image Management */}
        {editing && (
          <ProductImageEditor
            productId={product.product_id}
            tenantId={tenantId}
            images={formData.images || []}
            mainImage={formData.image_url || null}
            onUpdate={(images, mainImage) => {
              setFormData({
                ...formData,
                images,
                image_url: mainImage
              })
            }}
          />
        )}

        {!editing && (
          <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'
              }}
            />
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            {editing ? (
              <Input
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            ) : (
              <p className="text-sm">{product.brand || '-'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Pack Size</Label>
            {editing ? (
              <Input
                value={formData.pack_size || ''}
                onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
              />
            ) : (
              <p className="text-sm">{product.pack_size || '-'}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          {editing ? (
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          ) : (
            <p className="text-sm">{product.description || '-'}</p>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Price (₹)</Label>
            {editing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            ) : (
              <p className="text-lg font-bold text-primary">₹{product.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>MRP (₹)</Label>
            {editing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
              />
            ) : (
              <p className="text-sm line-through text-muted-foreground">₹{product.mrp}</p>
            )}
          </div>
        </div>

        {discount > 0 && (
          <Badge variant="destructive">
            <Percent className="h-3 w-3 mr-1" />
            {discount}% OFF
          </Badge>
        )}

        {/* Offer Badge */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Offer Badge</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="badge-visible">Show Badge</Label>
              <Switch
                id="badge-visible"
                checked={formData.offer_badge_visible || false}
                onCheckedChange={(checked) => setFormData({ ...formData, offer_badge_visible: checked })}
                disabled={!editing}
              />
            </div>

            {(editing || formData.offer_badge_visible) && (
              <div className="space-y-2">
                <Label>Badge Text</Label>
                {editing ? (
                  <Input
                    value={formData.offer_badge_text || ''}
                    onChange={(e) => setFormData({ ...formData, offer_badge_text: e.target.value })}
                    placeholder="e.g., 9% off, Buy 1 Get 1"
                  />
                ) : (
                  <Badge variant="destructive">
                    {product.offer_badge_text || `${discount}% OFF`}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tag"
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {product.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {(!product.tags || product.tags.length === 0) && (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>
          )}
        </div>

        {/* Status Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              disabled={!editing}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              disabled={!editing}
            />
          </div>
        </div>

        {/* Inventory */}
        {editing && (
          <div className="space-y-2">
            <Label>Inventory Count</Label>
            <Input
              type="number"
              value={formData.inventory_count || 0}
              onChange={(e) => setFormData({ ...formData, inventory_count: parseInt(e.target.value) })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

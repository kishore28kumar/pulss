import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  Upload, 
  Trash, 
  Image as ImageIcon,
  Plus,
  Star,
  ArrowsDownUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ProductImageEditorProps {
  productId: string
  tenantId: string
  images: string[]
  mainImage: string | null
  onUpdate: (images: string[], mainImage: string) => void
}

export const ProductImageEditor = ({ 
  productId, 
  tenantId, 
  images = [], 
  mainImage,
  onUpdate 
}: ProductImageEditorProps) => {
  const [localImages, setLocalImages] = useState<string[]>(images || [])
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleUpload = async (files: FileList) => {
    if (!files.length) return

    setUploading(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(
        `/api/products/tenants/${tenantId}/${productId}/images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      const updatedImages = data.product.images || []
      const updatedMainImage = data.product.image_url || updatedImages[0]

      setLocalImages(updatedImages)
      onUpdate(updatedImages, updatedMainImage)
      
      toast.success(`${files.length} image(s) uploaded successfully`)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/images`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_url: imageUrl })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }

      const data = await response.json()
      const updatedImages = data.product.images || []
      const updatedMainImage = data.product.image_url || (updatedImages.length > 0 ? updatedImages[0] : null)

      setLocalImages(updatedImages)
      onUpdate(updatedImages, updatedMainImage || '')
      
      toast.success('Image deleted successfully')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete image')
    }
  }

  const handleReorder = async (newOrder: string[]) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/images/reorder`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ images: newOrder })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Reorder failed')
      }

      const data = await response.json()
      const updatedImages = data.product.images || []
      const updatedMainImage = data.product.image_url || updatedImages[0]

      setLocalImages(updatedImages)
      onUpdate(updatedImages, updatedMainImage)
      
      toast.success('Images reordered successfully')
    } catch (error: any) {
      console.error('Reorder error:', error)
      toast.error(error.message || 'Failed to reorder images')
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...localImages]
    const draggedImage = newImages[draggedIndex]
    
    // Remove from old position
    newImages.splice(draggedIndex, 1)
    // Insert at new position
    newImages.splice(index, 0, draggedImage)
    
    setLocalImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      handleReorder(localImages)
    }
    setDraggedIndex(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Product Images</span>
              </CardTitle>
              <CardDescription>
                Manage product images. Drag to reorder.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              disabled={uploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Images
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localImages.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No images yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {localImages.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-move hover:border-primary transition-colors"
                >
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center space-x-1">
                    {index === 0 && (
                      <Badge className="bg-primary text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Main
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Drag indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      <ArrowsDownUp className="h-3 w-3 mr-1" />
                      Drag
                    </Badge>
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image)}
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Images</DialogTitle>
            <DialogDescription>
              Upload one or more images for this product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Select Images</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleUpload(e.target.files)
                    setIsDialogOpen(false)
                  }
                }}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Supports: JPG, PNG, WebP, GIF (max 5MB each)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

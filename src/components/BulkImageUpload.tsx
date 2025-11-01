import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle,
  Trash,
  Package,
  FileDashed
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface UploadedImage {
  file: File
  preview: string
  sku: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export const BulkImageUpload = ({ tenantId, onUploadComplete }: { tenantId: string; onUploadComplete?: () => void }) => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const extractSkuFromFilename = (filename: string): string => {
    // Remove extension
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
    // Extract SKU (first part before dash, underscore, or space)
    return nameWithoutExt.split(/[-_\s]/)[0].toUpperCase()
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files only')
      return
    }

    const newImages: UploadedImage[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      sku: extractSkuFromFilename(file.name),
      status: 'pending'
    }))

    setImages(prev => [...prev, ...newImages])
    toast.success(`Added ${newImages.length} images`)
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  const updateSku = (index: number, sku: string) => {
    setImages(prev => {
      const newImages = [...prev]
      newImages[index] = { ...newImages[index], sku: sku.toUpperCase() }
      return newImages
    })
  }

  const handleUpload = async () => {
    if (images.length === 0) {
      toast.error('Please add some images first')
      return
    }

    // Check if all images have SKUs
    const missingSkus = images.filter(img => !img.sku)
    if (missingSkus.length > 0) {
      toast.error(`${missingSkus.length} images are missing SKU codes`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      // Add all image files
      images.forEach((img, index) => {
        formData.append('images', img.file)
      })

      // Add SKU mappings
      const mappings = images.map((img, index) => ({
        sku: img.sku,
        imageIndex: index
      }))
      formData.append('mappings', JSON.stringify(mappings))

      const response = await fetch(
        `/api/products/tenants/${tenantId}/bulk-upload-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      )

      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Update status for each image
      setImages(prev => prev.map((img, index) => {
        const result = data.results.updated_products.find((p: any) => p.sku === img.sku)
        if (result) {
          return { ...img, status: 'success' }
        } else {
          const errorInfo = data.results.errors.find((e: any) => e.sku === img.sku)
          return { 
            ...img, 
            status: 'error',
            error: errorInfo?.error || 'Product not found'
          }
        }
      }))

      toast.success(
        `Upload complete! ${data.results.success} images uploaded successfully.`
      )

      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload images')
      
      // Mark all as error
      setImages(prev => prev.map(img => ({
        ...img,
        status: 'error',
        error: error.message
      })))
    } finally {
      setUploading(false)
    }
  }

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
  }

  const successCount = images.filter(img => img.status === 'success').length
  const errorCount = images.filter(img => img.status === 'error').length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5" />
            <span>Bulk Image Upload</span>
          </CardTitle>
          <CardDescription>
            Upload multiple product images at once. Images will be matched to products by SKU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted'}
              ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('bulk-image-input')?.click()}
          >
            <FileDashed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drag and drop images here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <Badge variant="outline">
              Supports: JPG, PNG, WebP, GIF
            </Badge>
            <input
              id="bulk-image-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* File naming instructions */}
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>File naming:</strong> Name your images with the product SKU followed by a dash or underscore.
              <br />
              Example: <code className="bg-muted px-1 rounded">PAR-500-1.jpg</code> will be matched to SKU "PAR-500"
            </AlertDescription>
          </Alert>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Summary */}
          {images.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-medium">{images.length} images</span>
                {successCount > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    {successCount} uploaded
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    {errorCount} failed
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={uploading}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || images.length === 0}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image List */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images to Upload</CardTitle>
            <CardDescription>
              Review and edit SKU mappings before uploading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {images.map((image, index) => (
                  <Card key={index} className={
                    image.status === 'success' ? 'border-green-200' :
                    image.status === 'error' ? 'border-red-200' :
                    ''
                  }>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-4">
                        {/* Image Preview */}
                        <div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={image.preview}
                            alt={image.file.name}
                            className="w-full h-full object-cover"
                          />
                          {image.status === 'success' && (
                            <div className="absolute inset-0 bg-green-600/80 flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                          )}
                          {image.status === 'error' && (
                            <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                              <XCircle className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-medium truncate">
                            {image.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(image.file.size / 1024).toFixed(2)} KB
                          </p>

                          {/* SKU Input */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs whitespace-nowrap">SKU:</Label>
                            <Input
                              value={image.sku}
                              onChange={(e) => updateSku(index, e.target.value)}
                              disabled={uploading || image.status === 'success'}
                              className="h-8 text-xs font-mono"
                              placeholder="PRODUCT-SKU"
                            />
                          </div>

                          {/* Error Message */}
                          {image.error && (
                            <p className="text-xs text-red-600">{image.error}</p>
                          )}
                        </div>

                        {/* Remove Button */}
                        {image.status !== 'success' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImage(index)}
                            disabled={uploading}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

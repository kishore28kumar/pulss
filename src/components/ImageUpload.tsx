import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Camera, 
  FileImage,
  Download,
  Trash
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  type: 'logo' | 'splash' | 'carousel' | 'product' | 'category'
  tenantId?: string
  maxFiles?: number
  maxSize?: number // in MB
  onUploadComplete?: (urls: string[]) => void
  existingImages?: string[]
  className?: string
  title?: string
  description?: string
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  tenantId,
  maxFiles = type === 'logo' ? 1 : type === 'splash' ? 5 : 10,
  maxSize = 5,
  onUploadComplete,
  existingImages = [],
  className = '',
  title,
  description
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>(existingImages)

  const getStoragePath = (file: File) => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    return `${type}/${tenantId || 'global'}/${timestamp}_${randomId}_${file.name}`
  }

  const uploadFile = async (file: File): Promise<string> => {
    const filePath = getStoragePath(file)
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)
    
    return publicUrl
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${maxSize}MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const urls: string[] = []
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const url = await uploadFile(file)
        urls.push(url)
        setUploadProgress(((i + 1) / validFiles.length) * 100)
      }

      const newImages = [...previewImages, ...urls]
      setPreviewImages(newImages)
      
      if (onUploadComplete) {
        onUploadComplete(urls)
      }
      
      toast.success(`Successfully uploaded ${validFiles.length} image(s)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      // Extract file path from URL to delete from storage
      const urlParts = imageUrl.split('/storage/v1/object/public/images/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage.from('images').remove([filePath])
      }
      
      const newImages = previewImages.filter((_, i) => i !== index)
      setPreviewImages(newImages)
      toast.success('Image removed')
    } catch (error) {
      toast.error('Failed to remove image')
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'logo': return 'Logo Upload'
      case 'splash': return 'Splash Screen Images'
      case 'carousel': return 'Carousel Images'
      case 'product': return 'Product Images'
      case 'category': return 'Category Images'
      default: return 'Image Upload'
    }
  }

  const getDescription = () => {
    if (description) return description
    switch (type) {
      case 'logo': return 'Upload your store logo (recommended: square image, 200x200px)'
      case 'splash': return 'Upload splash screen images that customers see when opening the app'
      case 'carousel': return 'Upload images for the homepage carousel (recommended: 16:9 ratio)'
      case 'product': return 'Upload product images (recommended: square, 300x300px or larger)'
      case 'category': return 'Upload category images (recommended: square, 200x200px)'
      default: return 'Upload images'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!uploading) {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = maxFiles > 1
              input.accept = 'image/*'
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement
                handleFiles(target.files)
              }
              input.click()
            }
          }}
        >
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop images here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, {maxSize}MB each
              </p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a')
              link.href = '/demo-products.csv'
              link.download = 'demo-products-template.csv'
              link.click()
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
          
          {type === 'product' && (
            <Badge variant="secondary" className="text-xs">
              Tip: Images in CSV will be automatically downloaded and uploaded
            </Badge>
          )}
        </div>

        {/* Preview Images */}
        {previewImages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">
              Current Images ({previewImages.length}/{maxFiles})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {previewImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`${type} ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(imageUrl, index)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips for each type */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <strong>Tips:</strong>{' '}
          {type === 'logo' && "Use PNG with transparent background for best results."}
          {type === 'splash' && "Use high-quality images that represent your brand. These show when the app loads."}
          {type === 'carousel' && "Use landscape images with important content in the center."}
          {type === 'product' && "Use clear, well-lit photos with white/clean backgrounds."}
          {type === 'category' && "Use icons or representative images that clearly show the category."}
        </div>
      </CardContent>
    </Card>
  )
}
import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Upload, 
  X, 
  Sparkle,
  Info
} from '@phosphor-icons/react'

interface PWAIconUploadProps {
  tenantId: string
  type: 'pwa-icon' | 'favicon'
  currentIconUrl?: string | null
  onUploadComplete?: (url: string) => void
  className?: string
}

export const PWAIconUpload: React.FC<PWAIconUploadProps> = ({
  tenantId,
  type,
  currentIconUrl,
  onUploadComplete,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentIconUrl || null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append(type === 'pwa-icon' ? 'pwa_icon' : 'favicon', file)

    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const endpoint = type === 'pwa-icon' 
      ? `${API_URL}/api/tenants/${tenantId}/pwa-icon`
      : `${API_URL}/api/tenants/${tenantId}/favicon`

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await response.json()
    return type === 'pwa-icon' ? data.pwa_icon_url : data.favicon_url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    // For PWA icons, recommend square images
    if (type === 'pwa-icon') {
      const img = new Image()
      img.onload = async () => {
        if (img.width !== img.height) {
          toast.warning('For best results, use a square image (e.g., 512x512)')
        }
        await uploadImage(file)
      }
      img.src = URL.createObjectURL(file)
    } else {
      await uploadImage(file)
    }
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const url = await uploadFile(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Update preview with full URL
      const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`
      setPreviewUrl(fullUrl)
      
      if (onUploadComplete) {
        onUploadComplete(url)
      }
      
      toast.success(`${type === 'pwa-icon' ? 'PWA icon' : 'Favicon'} uploaded successfully`)
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

  const removeIcon = () => {
    setPreviewUrl(null)
    toast.info('Icon removed. Upload a new one or save to use default.')
  }

  const getTitle = () => {
    return type === 'pwa-icon' ? 'PWA App Icon' : 'Favicon'
  }

  const getDescription = () => {
    return type === 'pwa-icon' 
      ? 'Upload a custom app icon for PWA installs (512x512 PNG recommended)'
      : 'Upload a custom favicon for browser tabs (32x32 or 64x64 PNG/ICO recommended)'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle />
          {getTitle()}
        </CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Icon Preview */}
        {previewUrl && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <img
              src={previewUrl}
              alt={getTitle()}
              className="w-16 h-16 object-cover rounded-lg border-2 border-border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Current {type === 'pwa-icon' ? 'Icon' : 'Favicon'}</p>
              <p className="text-xs text-muted-foreground">Click upload to replace</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeIcon}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

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
              input.accept = 'image/png,image/jpeg,image/jpg,image/ico'
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
                Drop {type === 'pwa-icon' ? 'icon' : 'favicon'} here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'pwa-icon' ? '512x512 PNG recommended' : '32x32 or 64x64 PNG/ICO recommended'}
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

        {/* Tips */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-700 dark:text-blue-400">
                {type === 'pwa-icon' ? 'PWA Icon Tips:' : 'Favicon Tips:'}
              </p>
              {type === 'pwa-icon' ? (
                <>
                  <p className="text-muted-foreground">• Use a square PNG image (512x512 recommended)</p>
                  <p className="text-muted-foreground">• This icon appears when customers install your store as an app</p>
                  <p className="text-muted-foreground">• Use simple, recognizable imagery that works at small sizes</p>
                  <p className="text-muted-foreground">• If not provided, your logo will be used as fallback</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">• Use a small square image (32x32 or 64x64)</p>
                  <p className="text-muted-foreground">• This appears in browser tabs and bookmarks</p>
                  <p className="text-muted-foreground">• PNG or ICO format works best</p>
                  <p className="text-muted-foreground">• Keep it simple and recognizable at small sizes</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

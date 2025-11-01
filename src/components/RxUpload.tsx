import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Upload, Camera, FileText, CheckCircle, Warning, X, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface RxUploadProps {
  orderId?: string
  onUploadComplete?: (urls: string[]) => void
  maxFiles?: number
  required?: boolean
}

interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  status: 'uploading' | 'success' | 'error'
}

export const RxUpload: React.FC<RxUploadProps> = ({
  orderId,
  onUploadComplete,
  maxFiles = 3,
  required = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `prescriptions/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid file type. Please upload images or PDFs only.`)
        return false
      }
      
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Please keep files under 10MB.`)
        return false
      }
      
      return true
    })

    if (uploadedFiles.length + validFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files.`)
      return
    }

    setIsUploading(true)

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: '',
      size: file.size,
      type: file.type,
      status: 'uploading' as const
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload files concurrently
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        const url = await uploadFile(file)
        const fileId = newFiles[index].id
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, url, status: 'success' as const }
              : f
          )
        )
        
        return url
      } catch (error) {
        const fileId = newFiles[index].id
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error' as const }
              : f
          )
        )
        toast.error(`Failed to upload ${file.name}`)
        throw error
      }
    })

    try {
      const urls = await Promise.all(uploadPromises)
      const successfulUrls = urls.filter(Boolean)
      
      if (successfulUrls.length > 0) {
        toast.success(`Successfully uploaded ${successfulUrls.length} file(s)`)
        onUploadComplete?.(successfulUrls)
        
        // Save to prescriptions table if orderId is provided
        if (orderId) {
          for (const url of successfulUrls) {
            await supabase
              .from('prescriptions')
              .insert({
                order_id: orderId,
                file_url: url,
                status: 'pending',
                uploaded_at: new Date().toISOString()
              })
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [uploadedFiles.length, maxFiles, onUploadComplete, orderId])

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
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Prescription Upload
          {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload prescription images or PDF documents. Max {maxFiles} files, 10MB each.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*,application/pdf'
            input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files)
            input.click()
          }}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              {isUploading ? (
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">
                {isUploading ? 'Uploading files...' : 'Drop files here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports JPG, PNG, PDF files up to 10MB each
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading || uploadedFiles.length >= maxFiles}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </div>

        {/* File List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.status === 'uploading' && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <Warning className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'success' && file.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(file.url, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guidelines */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Prescription Guidelines:</strong>
            <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
              <li>Ensure prescription is clearly visible and readable</li>
              <li>Include doctor's name, signature, and date</li>
              <li>Patient name should match your account details</li>
              <li>Prescription should be valid (not expired)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
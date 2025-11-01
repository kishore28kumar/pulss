import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon, 
  VideoCamera,
  Link,
  Pencil,
  Trash,
  Eye,
  ArrowUp,
  ArrowDown
} from '@phosphor-icons/react'

interface CarouselSlide {
  id?: string
  title: string
  description: string
  image_url?: string
  video_url?: string
  action_text?: string
  action_url?: string
  display_order: number
  is_active: boolean
}

interface CarouselManagerProps {
  tenantId: string
  existingSlides: CarouselSlide[]
  onSlidesChange: (slides: CarouselSlide[]) => void
}

export const CarouselManager = ({ tenantId, existingSlides, onSlidesChange }: CarouselManagerProps) => {
  const [slides, setSlides] = useState<CarouselSlide[]>(existingSlides)
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  
  const queryClient = useQueryClient()
  
  const saveSlidesMutation = useMutation({
    mutationFn: async (slidesToSave: CarouselSlide[]) => {
      // Save to supabase carousel_slides table
      const { error } = await supabase
        .from('carousel_slides')
        .upsert(
          slidesToSave.map(slide => ({
            ...slide,
            tenant_id: tenantId,
            updated_at: new Date().toISOString()
          }))
        )
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Carousel updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['carousel', tenantId] })
      onSlidesChange(slides)
    },
    onError: (error) => {
      toast.error('Failed to update carousel: ' + error.message)
    }
  })
  
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${tenantId}/carousel/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('pulss-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('pulss-media')
          .getPublicUrl(fileName)
        
        return {
          fileName,
          publicUrl,
          isVideo: file.type.startsWith('video/')
        }
      })
      
      return Promise.all(uploadPromises)
    },
    onSuccess: (uploadedFiles) => {
      // Add uploaded files as new slides
      const newSlides = uploadedFiles.map((file, index) => ({
        title: `Slide ${slides.length + index + 1}`,
        description: 'Add your description here',
        [file.isVideo ? 'video_url' : 'image_url']: file.publicUrl,
        display_order: slides.length + index,
        is_active: true
      }))
      
      setSlides(prev => [...prev, ...newSlides])
      setUploadingFiles([])
    },
    onError: (error) => {
      toast.error('Failed to upload files: ' + error.message)
      setUploadingFiles([])
    }
  })
  
  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )
    
    if (fileArray.length === 0) {
      toast.error('Please select valid image or video files')
      return
    }
    
    setUploadingFiles(fileArray)
    uploadFilesMutation.mutate(fileArray)
  }
  
  const addNewSlide = () => {
    const newSlide: CarouselSlide = {
      title: `Slide ${slides.length + 1}`,
      description: 'Add your description here',
      display_order: slides.length,
      is_active: true
    }
    setEditingSlide(newSlide)
    setIsDialogOpen(true)
  }
  
  const editSlide = (slide: CarouselSlide) => {
    setEditingSlide({ ...slide })
    setIsDialogOpen(true)
  }
  
  const saveSlide = () => {
    if (!editingSlide) return
    
    if (editingSlide.id) {
      // Edit existing slide
      setSlides(prev => prev.map(s => s.id === editingSlide.id ? editingSlide : s))
    } else {
      // Add new slide
      const newSlide = {
        ...editingSlide,
        id: `temp-${Date.now()}` // temporary ID
      }
      setSlides(prev => [...prev, newSlide])
    }
    
    setIsDialogOpen(false)
    setEditingSlide(null)
  }
  
  const deleteSlide = (slideId: string) => {
    setSlides(prev => prev.filter(s => s.id !== slideId))
  }
  
  const moveSlide = (slideId: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(s => s.id === slideId)
    if (slideIndex === -1) return
    
    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1
    
    if (targetIndex < 0 || targetIndex >= slides.length) return
    
    // Swap slides
    [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]]
    
    // Update display order
    newSlides.forEach((slide, index) => {
      slide.display_order = index
    })
    
    setSlides(newSlides)
  }
  
  const toggleSlideActive = (slideId: string) => {
    setSlides(prev => prev.map(s => 
      s.id === slideId ? { ...s, is_active: !s.is_active } : s
    ))
  }
  
  const saveAllSlides = () => {
    saveSlidesMutation.mutate(slides)
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Hero Carousel Manager
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your homepage carousel slides and videos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('carousel-file-upload')?.click()}
              disabled={uploadFilesMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadFilesMutation.isPending ? 'Uploading...' : 'Upload Media'}
            </Button>
            <Button onClick={addNewSlide}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload Input */}
        <input
          id="carousel-file-upload"
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        />
        
        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Uploading {uploadingFiles.length} file(s)...
            </p>
            <div className="space-y-1">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-blue-600">
                  {file.type.startsWith('video/') ? (
                    <VideoCamera className="w-3 h-3" />
                  ) : (
                    <ImageIcon className="w-3 h-3" />
                  )}
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Slides List */}
        {slides.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-medium mb-2">No carousel slides</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload images or videos to create engaging carousel slides
            </p>
            <Button onClick={addNewSlide}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Slide
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <div 
                key={slide.id} 
                className={`border rounded-lg p-4 ${
                  slide.is_active ? 'bg-card' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-20 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {slide.video_url ? (
                      <div className="relative w-full h-full bg-black rounded overflow-hidden">
                        <VideoCamera className="w-6 h-6 text-white absolute inset-0 m-auto" />
                      </div>
                    ) : slide.image_url ? (
                      <img 
                        src={slide.image_url} 
                        alt={slide.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{slide.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {slide.description}
                        </p>
                        {slide.action_text && slide.action_url && (
                          <div className="flex items-center gap-1 mt-1">
                            <Link className="w-3 h-3" />
                            <span className="text-xs text-blue-600">{slide.action_text}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                          {slide.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Order: {index + 1}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSlide(slide.id!, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSlide(slide.id!, 'down')}
                        disabled={index === slides.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editSlide(slide)}
                        className="h-6 w-6 p-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSlideActive(slide.id!)}
                        className="h-6 w-6 p-0"
                      >
                        <Eye className={`w-3 h-3 ${slide.is_active ? '' : 'opacity-50'}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlide(slide.id!)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Save Button */}
        {slides.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={saveAllSlides}
              disabled={saveSlidesMutation.isPending}
            >
              {saveSlidesMutation.isPending ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Edit Slide Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSlide?.id ? 'Edit Slide' : 'Add New Slide'}
            </DialogTitle>
          </DialogHeader>
          
          {editingSlide && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="slide-title">Title *</Label>
                <Input
                  id="slide-title"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                  placeholder="Enter slide title"
                />
              </div>
              
              <div>
                <Label htmlFor="slide-description">Description *</Label>
                <Textarea
                  id="slide-description"
                  value={editingSlide.description}
                  onChange={(e) => setEditingSlide(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  placeholder="Enter slide description"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slide-image">Image URL</Label>
                  <Input
                    id="slide-image"
                    value={editingSlide.image_url || ''}
                    onChange={(e) => setEditingSlide(prev => 
                      prev ? { ...prev, image_url: e.target.value, video_url: undefined } : null
                    )}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="slide-video">Video URL</Label>
                  <Input
                    id="slide-video"
                    value={editingSlide.video_url || ''}
                    onChange={(e) => setEditingSlide(prev => 
                      prev ? { ...prev, video_url: e.target.value, image_url: undefined } : null
                    )}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="action-text">Action Button Text</Label>
                  <Input
                    id="action-text"
                    value={editingSlide.action_text || ''}
                    onChange={(e) => setEditingSlide(prev => 
                      prev ? { ...prev, action_text: e.target.value } : null
                    )}
                    placeholder="Shop Now, Learn More..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="action-url">Action URL</Label>
                  <Input
                    id="action-url"
                    value={editingSlide.action_url || ''}
                    onChange={(e) => setEditingSlide(prev => 
                      prev ? { ...prev, action_url: e.target.value } : null
                    )}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSlide}>
                  {editingSlide.id ? 'Update Slide' : 'Add Slide'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
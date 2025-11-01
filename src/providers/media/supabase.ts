import { MediaProvider } from './index'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export class SupabaseMediaProvider implements MediaProvider {
  private readonly bucketName = 'pulss-media'

  async uploadFile(file: File, path: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured for file uploads')
    }

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`
    const fullPath = `${path}/${fileName}`

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    return this.getPublicUrl(data.path)
  }

  async deleteFile(path: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false
    }

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path])

    return !error
  }

  getPublicUrl(path: string): string {
    if (!isSupabaseConfigured()) {
      return '/placeholder-image.png'
    }

    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path)

    return data.publicUrl
  }

  isConfigured(): boolean {
    return isSupabaseConfigured()
  }

  // Helper method to create storage bucket if it doesn't exist
  async ensureBucket(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false

    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName)

      if (!bucketExists) {
        // Create bucket
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/pdf']
        })
        
        if (error) {
          console.error('Failed to create storage bucket:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error checking/creating bucket:', error)
      return false
    }
  }
}
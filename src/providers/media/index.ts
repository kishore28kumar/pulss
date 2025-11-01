// Media Provider Interface
export interface MediaProvider {
  uploadFile(file: File, path: string): Promise<string>
  deleteFile(path: string): Promise<boolean>
  getPublicUrl(path: string): string
  isConfigured(): boolean
}

import { SupabaseMediaProvider } from './supabase'

// Provider factory
export const createMediaProvider = (provider: string = 'supabase'): MediaProvider => {
  switch (provider) {
    case 'supabase':
    default:
      return new SupabaseMediaProvider()
  }
}
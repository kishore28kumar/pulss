import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, Upload, User, Phone, MapPin, Globe, WhatsappLogo } from '@phosphor-icons/react'

interface ProfileData {
  id?: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
  business_name?: string
  business_address?: string
  whatsapp_number?: string
  website?: string
  social_media?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
}

interface ProfileManagerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profileData: ProfileData) => void
  profileData: ProfileData
  userRole: 'super_admin' | 'admin' | 'customer'
  isLoading?: boolean
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  profileData,
  userRole,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProfileData>(profileData)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(profileData.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }))
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    // If there's an avatar file, we'd normally upload it first
    // For now, we'll include the preview URL
    const dataToSave = {
      ...formData,
      avatar_url: avatarPreview || formData.avatar_url
    }

    onSave(dataToSave)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isBusinessAccount = userRole === 'admin'
  const isSuperAdmin = userRole === 'super_admin'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle>
                {isSuperAdmin ? 'Super Admin Profile' : 
                 isBusinessAccount ? 'Business Profile' : 'Customer Profile'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your {isBusinessAccount ? 'business' : 'personal'} information and preferences
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.name || 'User')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <h3 className="font-semibold">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">
                Upload a clear photo. Max size 5MB.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Photo
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <div className="flex items-center gap-2">
                  <WhatsappLogo className="h-4 w-4 text-green-500" />
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp_number || ''}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information (for admins) */}
          {isBusinessAccount && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Business Information</h3>
                <Badge variant="secondary">Business Account</Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name || ''}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address || ''}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="Complete business address"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourbusiness.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Media (for admins) */}
          {isBusinessAccount && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Social Media</h3>
              <p className="text-sm text-muted-foreground">
                Add your social media handles so customers can connect with you
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.social_media?.facebook || ''}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    placeholder="facebook.com/yourbusiness"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.social_media?.instagram || ''}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    placeholder="instagram.com/yourbusiness"
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.social_media?.twitter || ''}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    placeholder="twitter.com/yourbusiness"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
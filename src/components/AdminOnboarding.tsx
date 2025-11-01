import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  Circle, 
  Storefront, 
  Palette, 
  Upload, 
  Phone, 
  MapPin,
  CreditCard,
  Package,
  Gear,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  User,
  At,
  WhatsappLogo,
  TelegramLogo,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  YoutubeLogo,
  LinkedinLogo,
  Globe,
  QrCode,
  Camera,
  X
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { ImageUpload } from './ImageUpload'
import { PWAIconUpload } from './PWAIconUpload'
import { ThemeSelector } from './ThemeSelector'
import { CSVUploader } from './CSVUploader'
import { CarouselManager } from './CarouselManager'
import { Footer } from './Footer'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface AdminOnboardingProps {
  onComplete: () => void
}

export const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onComplete }) => {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  // Clear any old agreement/legal popups that might be stored
  useEffect(() => {
    const clearOldData = async () => {
      try {
        await spark.kv.delete('agreement-accepted')
        await spark.kv.delete('legal-agreement')
        await spark.kv.delete('terms-accepted') 
        await spark.kv.delete('privacy-accepted')
        await spark.kv.delete('show-agreement')
        await spark.kv.delete('show-legal-modal')
      } catch (error) {
        // Ignore errors - these keys might not exist
      }
    }
    clearOldData()
  }, [])
  
  // Business Information
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<string>('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  
  // Chemist Personal Information
  const [chemistName, setChemistName] = useState('')
  const [chemistEmail, setChemistEmail] = useState('')
  const [chemistPhone, setChemistPhone] = useState('')
  const [chemistWhatsapp, setChemistWhatsapp] = useState('')
  const [chemistTelegram, setChemistTelegram] = useState('')
  
  // Payment Information
  const [upiId, setUpiId] = useState('')
  const [upiQrCode, setUpiQrCode] = useState<string | null>(null)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  
  // Social Media Links
  const [facebookUrl, setFacebookUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  
  // Theme & Branding
  const [selectedTheme, setSelectedTheme] = useState('theme-medical-blue')
  const [primaryColor, setPrimaryColor] = useState('#6366F1')
  const [pwaIconUrl, setPwaIconUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  
  // Hero Images & Carousel
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [splashImage, setSplashImage] = useState<string | null>(null)
  const [carouselSlides, setCarouselSlides] = useState<any[]>([])
  
  // Import demo carousel slides for initialization
  const [demoCarouselSlides] = useState(() => {
    return [
      {
        id: 'slide-1',
        title: 'Welcome to Your Store',
        description: 'Upload your own images and customize your homepage carousel',
        image_url: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=1200&h=600&fit=crop&crop=center',
        action_text: 'Shop Now',
        action_url: '#categories',
        display_order: 1,
        is_active: true
      },
      {
        id: 'slide-2',
        title: 'Professional Service',
        description: 'Provide expert consultation and quality products to your customers',
        image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop&crop=center',
        action_text: 'Learn More',
        action_url: '#consultation',
        display_order: 2,
        is_active: true
      }
    ]
  })
  
  // Products Setup
  const [productsUploaded, setProductsUploaded] = useState(false)
  const [categoriesCount, setCategoriesCount] = useState(0)
  const [productsCount, setProductsCount] = useState(0)

  const steps: OnboardingStep[] = [
    {
      id: 'business',
      title: 'Business Information',
      description: 'Tell us about your business',
      icon: <Storefront className="w-5 h-5" />,
      completed: !!(businessName && businessType && businessAddress && businessPhone)
    },
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Your contact details',
      icon: <User className="w-5 h-5" />,
      completed: !!(chemistName && chemistEmail && chemistPhone)
    },
    {
      id: 'branding',
      title: 'Branding & Theme',
      description: 'Customize your store appearance',
      icon: <Palette className="w-5 h-5" />,
      completed: !!(selectedTheme && logoUrl)
    },
    {
      id: 'carousel',
      title: 'Hero Banners',
      description: 'Upload carousel images for homepage',
      icon: <Camera className="w-5 h-5" />,
      completed: carouselSlides.length > 0 || heroImages.length > 0
    },
    {
      id: 'payment',
      title: 'Payment Setup',
      description: 'Configure payment methods',
      icon: <CreditCard className="w-5 h-5" />,
      completed: !!(upiId)
    },
    {
      id: 'social',
      title: 'Social Media & Contact',
      description: 'Add communication channels',
      icon: <WhatsappLogo className="w-5 h-5" />,
      completed: !!(chemistWhatsapp || facebookUrl || instagramUrl)
    },
    {
      id: 'products',
      title: 'Add Products',
      description: 'Upload your product catalog',
      icon: <Package className="w-5 h-5" />,
      completed: productsUploaded && productsCount > 0
    },
    {
      id: 'final',
      title: 'Final Setup',
      description: 'Review and launch your store',
      icon: <Sparkle className="w-5 h-5" />,
      completed: false
    }
  ]

  const progress = Math.round((steps.filter(step => step.completed).length / steps.length) * 100)

  useEffect(() => {
    // Load existing data if any
    loadExistingData()
  }, [profile])

  const loadExistingData = async () => {
    if (!profile?.tenant_id) return

    try {
      const { data: settings } = await supabase
        .from('chemist_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

      if (settings) {
        setBusinessName(settings.business_name || '')
        setBusinessType(settings.business_type || '')
        setBusinessAddress(settings.address || '')
        setBusinessPhone(settings.business_phone || '')
        setWhatsappNumber(settings.whatsapp_number || '')
        
              // Personal information
        setChemistName(settings.chemist_name || '')
        setChemistEmail(settings.chemist_email || '')
        setChemistPhone(settings.chemist_phone || '')
        setChemistWhatsapp(settings.chemist_whatsapp || '')
        setChemistTelegram(settings.chemist_telegram || '')
        
        // Payment information
        setUpiId(settings.upi_id || '')
        setUpiQrCode(settings.upi_qr_code || null)
        setBankName(settings.bank_name || '')
        setAccountNumber(settings.bank_account || '')
        setIfscCode(settings.ifsc_code || '')
        
        // Social media
        setFacebookUrl(settings.facebook_url || '')
        setInstagramUrl(settings.instagram_url || '')
        setTwitterUrl(settings.twitter_url || '')
        setYoutubeUrl(settings.youtube_url || '')
        setLinkedinUrl(settings.linkedin_url || '')
        setWebsiteUrl(settings.website_url || '')
        
        // Branding
        setLogoUrl(settings.logo_url)
        setPrimaryColor(settings.primary_color || '#6366F1')
        setSelectedTheme(settings.theme_id || 'theme-medical-blue')
      }

      // Check products count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)

      const { count: categoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)

      setProductsCount(productCount || 0)
      setCategoriesCount(categoryCount || 0)
      setProductsUploaded((productCount || 0) > 0)

      // Load carousel slides
      const { data: carouselData } = await supabase
        .from('carousel_slides')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('display_order')

      if (carouselData && carouselData.length > 0) {
        setCarouselSlides(carouselData)
        // Also update heroImages for backward compatibility
        const imageUrls = carouselData
          .map(slide => slide.image_url)
          .filter((url): url is string => Boolean(url))
        setHeroImages(imageUrls)
      } else {
        // Initialize with demo data if no carousel slides exist
        setCarouselSlides(demoCarouselSlides)
      }

    } catch (error) {
      console.error('Error loading existing data:', error)
    }
  }

  const saveBusinessInfo = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          business_name: businessName,
          business_type: businessType,
          business_description: businessDescription,
          address: businessAddress,
          business_phone: businessPhone,
          whatsapp_number: whatsappNumber,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Also update the tenant name
      await supabase
        .from('tenants')
        .update({ name: businessName })
        .eq('id', profile.tenant_id)

      toast.success('Business information saved!')
      nextStep()
    } catch (error) {
      console.error('Error saving business info:', error)
      toast.error('Failed to save business information')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBrandingInfo = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          theme_id: selectedTheme,
          primary_color: primaryColor,
          logo_url: logoUrl,
          hero_images: heroImages,
          splash_screen_url: splashImage,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Branding settings saved!')
      nextStep()
    } catch (error) {
      console.error('Error saving branding info:', error)
      toast.error('Failed to save branding settings')
    } finally {
      setIsLoading(false)
    }
  }

  const savePaymentInfo = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          upi_id: upiId,
          upi_qr_code: upiQrCode,
          bank_name: bankName,
          bank_account: accountNumber,
          ifsc_code: ifscCode,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Payment information saved!')
      nextStep()
    } catch (error) {
      console.error('Error saving payment info:', error)
      toast.error('Failed to save payment information')
    } finally {
      setIsLoading(false)
    }
  }

  const savePersonalInfo = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          chemist_name: chemistName,
          chemist_email: chemistEmail,
          chemist_phone: chemistPhone,
          chemist_whatsapp: chemistWhatsapp,
          chemist_telegram: chemistTelegram,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Personal information saved!')
      nextStep()
    } catch (error) {
      console.error('Error saving personal info:', error)
      toast.error('Failed to save personal information')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSocialMediaInfo = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          youtube_url: youtubeUrl,
          linkedin_url: linkedinUrl,
          website_url: websiteUrl,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Social media information saved!')
      nextStep()
    } catch (error) {
      console.error('Error saving social media info:', error)
      toast.error('Failed to save social media information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductsUploaded = () => {
    setProductsUploaded(true)
    loadExistingData() // Refresh counts
    toast.success('Products uploaded successfully!')
    nextStep()
  }

  const completeOnboarding = async () => {
    if (!profile?.tenant_id) return

    setIsLoading(true)
    try {
      // Mark onboarding as complete
      const { error } = await supabase
        .from('chemist_settings')
        .upsert({
          tenant_id: profile.tenant_id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('🎉 Congratulations! Your store is ready to go!')
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete setup')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case 'business':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. City Medical Store"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="medical_store">Medical Store</SelectItem>
                    <SelectItem value="grocery">Grocery Store</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="electronics">Electronics Store</SelectItem>
                    <SelectItem value="clothing">Clothing Store</SelectItem>
                    <SelectItem value="general">General Store</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Brief description of your business..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone *</Label>
                <Input
                  id="businessPhone"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Textarea
                id="businessAddress"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Full business address including pin code"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Business Logo</Label>
              <ImageUpload
                type="logo"
                tenantId={profile?.tenant_id || undefined}
                maxFiles={1}
                maxSize={2}
                onUploadComplete={(urls) => setLogoUrl(urls[0] || null)}
                existingImages={logoUrl ? [logoUrl] : []}
                description="Upload your business logo (recommended size: 200x200px)"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={saveBusinessInfo} 
                disabled={!businessName || !businessType || !businessAddress || !businessPhone || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'personal':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Chemist Personal Information</h3>
              <p className="text-blue-700 text-sm">
                This information helps customers connect with you personally and builds trust.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="chemistName">Chemist Name *</Label>
                <Input
                  id="chemistName"
                  value={chemistName}
                  onChange={(e) => setChemistName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chemistEmail">Email Address *</Label>
                <Input
                  id="chemistEmail"
                  type="email"
                  value={chemistEmail}
                  onChange={(e) => setChemistEmail(e.target.value)}
                  placeholder="chemist@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="chemistPhone">Personal Phone *</Label>
                <Input
                  id="chemistPhone"
                  value={chemistPhone}
                  onChange={(e) => setChemistPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chemistWhatsapp">
                  <div className="flex items-center gap-2">
                    <WhatsappLogo className="w-4 h-4 text-green-500" />
                    WhatsApp Number
                  </div>
                </Label>
                <Input
                  id="chemistWhatsapp"
                  value={chemistWhatsapp}
                  onChange={(e) => setChemistWhatsapp(e.target.value)}
                  placeholder="+91 9876543210"
                />
                <p className="text-xs text-muted-foreground">
                  Customers will see a WhatsApp chat button with this number
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chemistTelegram">
                <div className="flex items-center gap-2">
                  <TelegramLogo className="w-4 h-4 text-blue-500" />
                  Telegram Username (Optional)
                </div>
              </Label>
              <Input
                id="chemistTelegram"
                value={chemistTelegram}
                onChange={(e) => setChemistTelegram(e.target.value)}
                placeholder="@username (without @)"
              />
              <p className="text-xs text-muted-foreground">
                Enable Telegram chat for customers. Great for quick consultations and bot integration.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={savePersonalInfo} 
                disabled={!chemistName || !chemistEmail || !chemistPhone || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'branding':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Store Theme</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Simple theme selection buttons */}
                {[
                  { id: 'theme-medical-blue', name: 'Medical Blue', color: '#6366F1' },
                  { id: 'theme-green-pharmacy', name: 'Pharmacy Green', color: '#059669' },
                  { id: 'theme-orange-grocery', name: 'Grocery Orange', color: '#EA580C' },
                  { id: 'theme-purple-modern', name: 'Modern Purple', color: '#7C3AED' },
                  { id: 'theme-red-urgent', name: 'Urgent Red', color: '#DC2626' },
                  { id: 'theme-teal-wellness', name: 'Wellness Teal', color: '#0D9488' }
                ].map((theme) => (
                  <Button
                    key={theme.id}
                    variant={selectedTheme === theme.id ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div 
                      className="w-8 h-8 rounded-full" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-sm">{theme.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PWAIconUpload
                tenantId={profile?.tenant_id || ''}
                type="pwa-icon"
                currentIconUrl={pwaIconUrl}
                onUploadComplete={(url) => setPwaIconUrl(url)}
              />
              <PWAIconUpload
                tenantId={profile?.tenant_id || ''}
                type="favicon"
                currentIconUrl={faviconUrl}
                onUploadComplete={(url) => setFaviconUrl(url)}
              />
            </div>

            <div className="space-y-4">
              <Label>Hero Carousel Images</Label>
              <p className="text-sm text-muted-foreground">
                Upload 2-5 images for your store's homepage carousel
              </p>
              <ImageUpload
                type="carousel"
                tenantId={profile?.tenant_id || undefined}
                maxFiles={5}
                maxSize={5}
                onUploadComplete={(urls) => setHeroImages(urls)}
                existingImages={heroImages}
                description="Upload hero images (recommended size: 1200x400px)"
              />
            </div>

            <div className="space-y-4">
              <Label>Splash Screen Image (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Image shown when customers first open your app
              </p>
              <ImageUpload
                type="splash"
                tenantId={profile?.tenant_id || undefined}
                maxFiles={1}
                maxSize={3}
                onUploadComplete={(urls) => setSplashImage(urls[0] || null)}
                existingImages={splashImage ? [splashImage] : []}
                description="Upload splash screen (recommended size: 400x600px)"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={saveBrandingInfo} 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'carousel':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Hero Banners & Carousel</h3>
              <p className="text-blue-700 text-sm">
                Create engaging carousel slides with images, titles, descriptions, and action buttons. These will be prominently displayed on your homepage.
              </p>
            </div>

            {/* Advanced Carousel Manager */}
            <CarouselManager
              tenantId={profile?.tenant_id || 'demo-tenant'}
              existingSlides={carouselSlides.length > 0 ? carouselSlides : demoCarouselSlides}
              onSlidesChange={(slides) => {
                setCarouselSlides(slides)
                // Also update heroImages for backward compatibility
                const imageUrls = slides
                  .map(slide => slide.image_url)
                  .filter((url): url is string => Boolean(url))
                setHeroImages(imageUrls)
              }}
            />

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Payment Setup</h3>
              <p className="text-green-700 text-sm">
                Configure your payment methods. UPI is required for instant digital payments.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID *</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourstore@paytm / yourstore@googlepay"
              />
            </div>

            <div className="space-y-2">
              <Label>UPI QR Code</Label>
              <ImageUpload
                type="product"
                tenantId={profile?.tenant_id || undefined}
                maxFiles={1}
                maxSize={2}
                onUploadComplete={(urls) => setUpiQrCode(urls[0] || null)}
                existingImages={upiQrCode ? [upiQrCode] : []}
                description="Upload your UPI QR code for easy customer payments (PNG/JPG, max 2MB)"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bank Details (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                For cash deposits and advanced payment options
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Bank account number"
                  type="password"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={savePaymentInfo} 
                disabled={!upiId || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'social':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 mb-6">
              <h3 className="font-semibold text-purple-800 mb-2">Social Media & Communication</h3>
              <p className="text-purple-700 text-sm">
                Add your social media profiles and communication channels to connect with customers.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Media Profiles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">
                    <div className="flex items-center gap-2">
                      <FacebookLogo className="w-4 h-4 text-blue-600" />
                      Facebook Page
                    </div>
                  </Label>
                  <Input
                    id="facebookUrl"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">
                    <div className="flex items-center gap-2">
                      <InstagramLogo className="w-4 h-4 text-pink-600" />
                      Instagram Profile
                    </div>
                  </Label>
                  <Input
                    id="instagramUrl"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">
                    <div className="flex items-center gap-2">
                      <TwitterLogo className="w-4 h-4 text-blue-400" />
                      Twitter/X Profile
                    </div>
                  </Label>
                  <Input
                    id="twitterUrl"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">
                    <div className="flex items-center gap-2">
                      <YoutubeLogo className="w-4 h-4 text-red-600" />
                      YouTube Channel
                    </div>
                  </Label>
                  <Input
                    id="youtubeUrl"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourstore"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">
                    <div className="flex items-center gap-2">
                      <LinkedinLogo className="w-4 h-4 text-blue-700" />
                      LinkedIn Profile
                    </div>
                  </Label>
                  <Input
                    id="linkedinUrl"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-600" />
                      Website
                    </div>
                  </Label>
                  <Input
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Communication Features</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <WhatsappLogo className="w-4 h-4 text-green-500" />
                  <span>WhatsApp chat button will be automatically added if you provided a WhatsApp number</span>
                </div>
                <div className="flex items-center gap-2">
                  <TelegramLogo className="w-4 h-4 text-blue-500" />
                  <span>Telegram chat option will be available if you provided a username</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-purple-500" />
                  <span>All social links will appear in your store footer and contact section</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={saveSocialMediaInfo} 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'products':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Package className="w-16 h-16 mx-auto text-primary" />
              <div>
                <h3 className="text-xl font-semibold">Add Your Products</h3>
                <p className="text-muted-foreground">
                  Upload your product catalog using our CSV template
                </p>
              </div>
            </div>

            {productsCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {productsCount} products uploaded across {categoriesCount} categories
                  </span>
                </div>
              </div>
            )}

            <CSVUploader
              tenantId={profile?.tenant_id || ''}
              onUploadComplete={handleProductsUploaded}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={!productsUploaded || productsCount === 0}
                className="min-w-[120px]"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'final':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Sparkle className="w-16 h-16 mx-auto text-primary" />
              <div>
                <h3 className="text-2xl font-bold">Almost Ready!</h3>
                <p className="text-muted-foreground">
                  Review your setup and launch your online store
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Setup Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Business:</span>
                    <p className="font-medium">{businessName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{businessType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Products:</span>
                    <p className="font-medium">{productsCount} items</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categories:</span>
                    <p className="font-medium">{categoriesCount} categories</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your online store will be accessible to customers</li>
                  <li>• You'll receive real-time notifications for new orders</li>
                  <li>• Customers can browse and order from your catalog</li>
                  <li>• You can manage orders from the admin dashboard</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={completeOnboarding} 
                disabled={isLoading}
                className="min-w-[140px] bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                🚀 Launch My Store
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Pulss! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Let's set up your online store in just a few minutes
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Setup Progress</span>
              <span className="text-sm font-medium">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'mr-4' : ''}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => goToStep(index)}
                    className={`flex items-center space-x-2 ${
                      currentStep === index 
                        ? 'bg-primary text-primary-foreground' 
                        : step.completed 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                    }`}
                    disabled={index > currentStep && !step.completed}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : currentStep === index ? (
                      step.icon
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </Button>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-border ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                {steps[currentStep].icon}
                <div>
                  <CardTitle>{steps[currentStep].title}</CardTitle>
                  <p className="text-muted-foreground">{steps[currentStep].description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <Footer variant="admin" />
    </div>
  )
}
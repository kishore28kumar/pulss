import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { 
  User, 
  Camera, 
  Envelope, 
  Phone, 
  MapPin, 
  Bell, 
  Shield, 
  Heart,
  CreditCard,
  ShoppingBag,
  Star,
  PencilSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string
  addresses: Array<{
    id: string
    type: 'home' | 'work' | 'other'
    address: string
    city: string
    state: string
    pincode: string
    is_default: boolean
  }>
  preferences: {
    notifications: boolean
    sms_updates: boolean
    email_updates: boolean
    dark_theme: boolean
  }
  loyalty_points: number
  wallet_balance: number
  total_orders: number
  favorite_products: string[]
}

interface CustomerProfileManagerProps {
  customerId?: string // If provided, shows admin view of customer
  isAdminView?: boolean
}

export const CustomerProfileManager: React.FC<CustomerProfileManagerProps> = ({
  customerId,
  isAdminView = false
}) => {
  const { user, profile } = useAuth()
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const fetchCustomerProfile = async () => {
    try {
      const targetCustomerId = customerId || user?.id
      if (!targetCustomerId) return

      // Fetch customer profile
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetCustomerId)
        .single()

      if (customerError) throw customerError

      // Fetch addresses
      const { data: addresses, error: addressError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', targetCustomerId)
        .order('is_default', { ascending: false })

      if (addressError && addressError.code !== 'PGRST116') throw addressError

      // Fetch orders count and loyalty points
      const { data: orderStats, error: statsError } = await supabase
        .from('orders')
        .select('id, total, loyalty_points_earned')
        .eq('customer_id', targetCustomerId)

      const totalOrders = orderStats?.length || 0
      const loyaltyPoints = orderStats?.reduce((sum, order) => sum + (order.loyalty_points_earned || 0), 0) || 0

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('customer_id', targetCustomerId)
        .single()

      const walletBalance = walletData?.balance || 0

      // Fetch favorite products
      const { data: favorites, error: favError } = await supabase
        .from('customer_favorites')
        .select('product_id')
        .eq('customer_id', targetCustomerId)

      const favoriteProducts = favorites?.map(f => f.product_id) || []

      const profile: CustomerProfile = {
        id: customerData.id,
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        avatar_url: customerData.avatar_url,
        addresses: addresses || [],
        preferences: {
          notifications: customerData.notifications_enabled ?? true,
          sms_updates: customerData.sms_updates_enabled ?? true,
          email_updates: customerData.email_updates_enabled ?? true,
          dark_theme: customerData.dark_theme_enabled ?? false
        },
        loyalty_points: loyaltyPoints,
        wallet_balance: walletBalance,
        total_orders: totalOrders,
        favorite_products: favoriteProducts
      }

      setCustomerProfile(profile)
      setFormData({
        name: profile.name,
        phone: profile.phone,
        email: profile.email
      })
    } catch (error) {
      console.error('Error fetching customer profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setCustomerProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to update profile picture')
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image under 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    uploadAvatar(file)
  }

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        })
        .eq('id', user?.id)

      if (error) throw error

      setCustomerProfile(prev => prev ? {
        ...prev,
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      } : null)

      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const updatePreferences = async (key: keyof CustomerProfile['preferences'], value: boolean) => {
    try {
      const columnMap = {
        notifications: 'notifications_enabled',
        sms_updates: 'sms_updates_enabled',
        email_updates: 'email_updates_enabled',
        dark_theme: 'dark_theme_enabled'
      }

      const { error } = await supabase
        .from('profiles')
        .update({ [columnMap[key]]: value })
        .eq('id', user?.id)

      if (error) throw error

      setCustomerProfile(prev => prev ? {
        ...prev,
        preferences: { ...prev.preferences, [key]: value }
      } : null)

      toast.success('Preferences updated')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  useEffect(() => {
    fetchCustomerProfile()
  }, [customerId, user?.id])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!customerProfile) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={customerProfile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {customerProfile.name.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              {!isAdminView && (
                <div className="absolute -bottom-2 -right-2">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                      {uploading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateProfile} size="sm">
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h2 className="text-2xl font-bold">{customerProfile.name || 'Customer'}</h2>
                    {!isAdminView && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(true)}
                        className="h-8 w-8 p-0"
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                      <Envelope className="h-4 w-4" />
                      <span>{customerProfile.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                      <Phone className="h-4 w-4" />
                      <span>{customerProfile.phone || 'No phone provided'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{customerProfile.total_orders}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{customerProfile.loyalty_points}</p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₹{customerProfile.wallet_balance}</p>
                <p className="text-sm text-muted-foreground">Wallet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Preferences & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive order updates and offers</p>
                    </div>
                    <Switch
                      checked={customerProfile.preferences.notifications}
                      onCheckedChange={(checked) => updatePreferences('notifications', checked)}
                      disabled={isAdminView}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Updates</p>
                      <p className="text-sm text-muted-foreground">Get SMS for order status</p>
                    </div>
                    <Switch
                      checked={customerProfile.preferences.sms_updates}
                      onCheckedChange={(checked) => updatePreferences('sms_updates', checked)}
                      disabled={isAdminView}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Updates</p>
                      <p className="text-sm text-muted-foreground">Receive promotional emails</p>
                    </div>
                    <Switch
                      checked={customerProfile.preferences.email_updates}
                      onCheckedChange={(checked) => updatePreferences('email_updates', checked)}
                      disabled={isAdminView}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy & Security
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Theme</p>
                      <p className="text-sm text-muted-foreground">Use dark theme for the app</p>
                    </div>
                    <Switch
                      checked={customerProfile.preferences.dark_theme}
                      onCheckedChange={(checked) => updatePreferences('dark_theme', checked)}
                      disabled={isAdminView}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {customerProfile.addresses.length > 0 ? (
                <div className="space-y-4">
                  {customerProfile.addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={address.type === 'home' ? 'default' : 'secondary'}>
                                {address.type}
                              </Badge>
                              {address.is_default && (
                                <Badge variant="outline">Default</Badge>
                              )}
                            </div>
                            <p className="font-medium">{address.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No addresses saved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {customerProfile.total_orders > 0 
                    ? `${customerProfile.total_orders} orders placed`
                    : 'No orders yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {customerProfile.favorite_products.length > 0
                    ? `${customerProfile.favorite_products.length} favorite products`
                    : 'No favorites yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
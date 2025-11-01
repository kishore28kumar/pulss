import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { LoyaltyRewards } from './LoyaltyRewards'
import { 
  User, 
  Lock, 
  Heart, 
  ShoppingCart, 
  Camera, 
  Eye, 
  EyeSlash, 
  Package,
  Trash,
  PencilSimple as Edit,
  FloppyDisk as Save,
  X,
  Plus,
  Minus,
  Star,
  ClockCounterClockwise
} from '@phosphor-icons/react'

interface Product {
  id: string
  name: string
  description?: string
  brand?: string
  price: number
  mrp: number
  image_url?: string
  category_name?: string
  requires_rx: boolean
  inventory_count: number
  storeName?: string
  storePhone?: string
}

interface CartItem extends Product {
  quantity: number
}

interface WishlistItem extends Product {
  addedAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  address?: {
    street: string
    city: string
    state: string
    pincode: string
  }
  dateOfBirth?: string
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    smsUpdates: boolean
  }
}

interface CustomerProfileModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  setCart: (cart: CartItem[]) => void
}

const defaultProfile: UserProfile = {
  id: 'customer-001',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+91 98765 43210',
  avatar: '',
  address: {
    street: '123 Medical Street',
    city: 'Healthcare City',
    state: 'Wellness State',
    pincode: '123456'
  },
  dateOfBirth: '1990-01-01',
  preferences: {
    notifications: true,
    emailUpdates: true,
    smsUpdates: false
  }
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  cart,
  setCart
}) => {
  const [userProfile, setUserProfile] = useKV<UserProfile>('user-profile', defaultProfile)
  const [wishlist, setWishlist] = useKV<WishlistItem[]>('customer-wishlist', [])
  const [savedCarts, setSavedCarts] = useKV<{ id: string; name: string; items: CartItem[]; savedAt: string }[]>('saved-carts', [])
  const [orderHistory] = useKV<any[]>('order-history', [
    {
      id: 'ORDER-001',
      date: '2024-01-15',
      total: 299.50,
      status: 'Delivered',
      items: 3,
      storeName: 'HealthCare Plus Pharmacy'
    },
    {
      id: 'ORDER-002', 
      date: '2024-01-10',
      total: 156.75,
      status: 'Delivered',
      items: 2,
      storeName: 'City Medical Store'
    }
  ])

  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<UserProfile>(defaultProfile)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    if (userProfile) {
      setEditForm(userProfile)
    }
  }, [userProfile])

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
        const result = e.target?.result as string
        setAvatarPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    // Validate form
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editForm.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(editForm.phone)) {
      toast.error('Please enter a valid phone number')
      return
    }

    // Update profile with new avatar if uploaded
    const updatedProfile = {
      ...editForm,
      avatar: avatarPreview || (userProfile?.avatar || '')
    }

    setUserProfile(updatedProfile)
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview('')
    toast.success('Profile updated successfully!')
  }

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    // In a real app, this would make an API call
    toast.success('Password changed successfully!')
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false
    })
  }

  const addToWishlist = (product: Product) => {
    const wishlistItem: WishlistItem = {
      ...product,
      addedAt: new Date().toISOString()
    }
    
    setWishlist(current => {
      const currentList = current || []
      const exists = currentList.find(item => item.id === product.id)
      if (exists) {
        toast.info('Item already in wishlist')
        return currentList
      }
      toast.success('Added to wishlist!')
      return [...currentList, wishlistItem]
    })
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist(current => (current || []).filter(item => item.id !== productId))
    toast.success('Removed from wishlist')
  }

  const moveWishlistToCart = (product: WishlistItem) => {
    // Add to cart
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }

    // Remove from wishlist
    removeFromWishlist(product.id)
    toast.success('Moved to cart!')
  }

  const saveCurrentCart = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const cartName = `Cart ${new Date().toLocaleDateString()}`
    const savedCart = {
      id: Date.now().toString(),
      name: cartName,
      items: cart,
      savedAt: new Date().toISOString()
    }

    setSavedCarts(current => [...(current || []), savedCart])
    toast.success('Cart saved successfully!')
  }

  const loadSavedCart = (savedCart: any) => {
    setCart(savedCart.items)
    toast.success(`Loaded cart: ${savedCart.name}`)
    onClose()
  }

  const deleteSavedCart = (cartId: string) => {
    setSavedCarts(current => (current || []).filter(cart => cart.id !== cartId))
    toast.success('Saved cart deleted')
  }

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId))
      toast.success('Item removed from cart')
      return
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const profile = userProfile || defaultProfile
  const wishlistItems = wishlist || []
  const savedCartItems = savedCarts || []
  const orders = orderHistory || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={avatarPreview || profile.avatar} 
                  alt={profile.name} 
                />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">My Account</DialogTitle>
                <DialogDescription>
                  Manage your profile, orders, and preferences
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-6 mx-6 mt-4">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User size={16} />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock size={16} />
                  Security
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="flex items-center gap-2">
                  <Heart size={16} />
                  Wishlist ({wishlistItems.length})
                </TabsTrigger>
                <TabsTrigger value="saved-carts" className="flex items-center gap-2">
                  <ShoppingCart size={16} />
                  Saved Carts ({savedCartItems.length})
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package size={16} />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center gap-2">
                  <Star size={16} />
                  Rewards
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Personal Information</CardTitle>
                          <CardDescription>
                            Update your personal details and preferences
                          </CardDescription>
                        </div>
                        <Button
                          variant={isEditing ? "outline" : "default"}
                          onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                        >
                          {isEditing ? <X size={16} /> : <Edit size={16} />}
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Upload */}
                      {isEditing && (
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage 
                              src={avatarPreview || profile.avatar} 
                              alt={profile.name} 
                            />
                            <AvatarFallback className="text-lg">
                              {getInitials(editForm.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Camera size={16} className="mr-2" />
                                  Change Photo
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Max size: 5MB. JPG, PNG formats supported.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={isEditing ? editForm.name : profile.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={isEditing ? editForm.email : profile.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={isEditing ? editForm.phone : profile.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dob">Date of Birth</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={isEditing ? editForm.dateOfBirth : profile.dateOfBirth}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <Label>Address</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Input
                              placeholder="Street Address"
                              value={isEditing ? editForm.address?.street : profile.address?.street}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address!, street: e.target.value }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="City"
                              value={isEditing ? editForm.address?.city : profile.address?.city}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address!, city: e.target.value }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="State"
                              value={isEditing ? editForm.address?.state : profile.address?.state}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address!, state: e.target.value }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="PIN Code"
                              value={isEditing ? editForm.address?.pincode : profile.address?.pincode}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address!, pincode: e.target.value }
                              }))}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                            <Save size={16} />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={passwordForm.showCurrent ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setPasswordForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                          >
                            {passwordForm.showCurrent ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={passwordForm.showNew ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                          >
                            {passwordForm.showNew ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={passwordForm.showConfirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                          >
                            {passwordForm.showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <Button onClick={handleChangePassword} className="w-full">
                        Update Password
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Wishlist Tab */}
                <TabsContent value="wishlist" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Wishlist ({wishlistItems.length})</CardTitle>
                      <CardDescription>
                        Items you've saved for later
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {wishlistItems.length === 0 ? (
                        <div className="text-center py-8">
                          <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Your wishlist is empty</p>
                          <p className="text-sm text-muted-foreground">Add items you love to save them for later</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {wishlistItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package size={24} className="text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-muted-foreground">{item.brand}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-semibold">₹{item.price}</span>
                                  {item.mrp > item.price && (
                                    <span className="text-sm text-muted-foreground line-through">₹{item.mrp}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => moveWishlistToCart(item)}
                                  disabled={item.inventory_count === 0}
                                >
                                  <ShoppingCart size={16} className="mr-2" />
                                  {item.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromWishlist(item.id)}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Saved Carts Tab */}
                <TabsContent value="saved-carts" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Saved Carts ({savedCartItems.length})</CardTitle>
                          <CardDescription>
                            Carts you've saved for later
                          </CardDescription>
                        </div>
                        {cart.length > 0 && (
                          <Button onClick={saveCurrentCart} size="sm">
                            <Plus size={16} className="mr-2" />
                            Save Current Cart
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {savedCartItems.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No saved carts yet</p>
                          <p className="text-sm text-muted-foreground">Save your current cart to access it later</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {savedCartItems.map((savedCart) => (
                            <div key={savedCart.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">{savedCart.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {savedCart.items.length} items • Saved {new Date(savedCart.savedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => loadSavedCart(savedCart)}
                                  >
                                    Load Cart
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteSavedCart(savedCart.id)}
                                  >
                                    <Trash size={16} />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {savedCart.items.slice(0, 3).map((item) => (
                                  <div key={item.id} className="flex items-center gap-3 text-sm">
                                    <span className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">
                                      {item.quantity}
                                    </span>
                                    <span className="flex-1">{item.name}</span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                {savedCart.items.length > 3 && (
                                  <p className="text-sm text-muted-foreground">
                                    +{savedCart.items.length - 3} more items
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>
                        Your recent orders and their status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {orders.length === 0 ? (
                        <div className="text-center py-8">
                          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No orders yet</p>
                          <p className="text-sm text-muted-foreground">Your order history will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">Order #{order.id}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.date).toLocaleDateString()} • {order.storeName}
                                  </p>
                                </div>
                                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>{order.items} items</span>
                                <span className="font-semibold">₹{order.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Loyalty Rewards Tab */}
                <TabsContent value="rewards" className="mt-4">
                  <LoyaltyRewards customerId={userProfile?.id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
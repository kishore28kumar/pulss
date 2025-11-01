import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  FileText,
  Wallet,
  Gift,
  Settings,
  Download,
  Calendar,
  Star,
  Package,
  CreditCard,
  Clock,
  Bell,
  Shield
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { 
  Order, 
  Customer, 
  CustomerAddress, 
  WishlistItem, 
  PrescriptionArchive,
  FeatureFlags,
  CustomerPrivacySettings 
} from '@/types'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import OrderTimeline from './OrderTimeline'
import AddressBook from './AddressBook'

interface CustomerDashboardProps {
  tenantId: string
  customerId: string
}

interface DashboardStats {
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  walletBalance: number
  activeWishlist: number
  savedAddresses: number
}

const QUICK_ACTIONS = [
  { id: 'reorder', label: 'Reorder', icon: ShoppingBag, color: 'bg-blue-500' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, color: 'bg-green-500' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, color: 'bg-purple-500' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'bg-yellow-500' },
  { id: 'loyalty', label: 'Loyalty', icon: Gift, color: 'bg-pink-500' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'bg-gray-500' }
]

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  tenantId,
  customerId
}) => {
  const { user } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionArchive[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [privacySettings, setPrivacySettings] = useState<CustomerPrivacySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [customerId, tenantId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadFeatureFlags(),
        loadCustomerData(),
        loadDashboardStats(),
        loadRecentOrders(),
        loadWishlistItems(),
        loadAddresses(),
        loadPrescriptions(),
        loadPrivacySettings()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadFeatureFlags = async () => {
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    setFeatureFlags(flags)
  }

  const loadCustomerData = async () => {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    setCustomer(customerData)
  }

  const loadDashboardStats = async () => {
    // Load orders for statistics
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('customer_id', customerId)

    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // Load wishlist count
    const { data: wishlist } = await supabase
      .from('customer_wishlist')
      .select('id')
      .eq('customer_id', customerId)

    // Load addresses count
    const { data: addressesData } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('customer_id', customerId)

    setStats({
      totalOrders,
      totalSpent,
      loyaltyPoints: customer?.loyalty_points || 0,
      walletBalance: customer?.wallet_balance || 0,
      activeWishlist: wishlist?.length || 0,
      savedAddresses: addressesData?.length || 0
    })
  }

  const loadRecentOrders = async () => {
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          product:products(*)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentOrders(orders || [])
  }

  const loadWishlistItems = async () => {
    if (!featureFlags?.wishlist_enabled) return

    const { data: wishlist } = await supabase
      .from('customer_wishlist')
      .select(`
        *,
        product:products(*)
      `)
      .eq('customer_id', customerId)
      .order('added_at', { ascending: false })
      .limit(6)

    setWishlistItems(wishlist || [])
  }

  const loadAddresses = async () => {
    if (!featureFlags?.address_book_enabled) return

    const { data: addressesData } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .limit(3)

    setAddresses(addressesData || [])
  }

  const loadPrescriptions = async () => {
    if (!featureFlags?.prescription_archive_enabled) return

    const { data: prescriptionsData } = await supabase
      .from('prescription_archive')
      .select('*')
      .eq('customer_id', customerId)
      .order('archived_at', { ascending: false })
      .limit(5)

    setPrescriptions(prescriptionsData || [])
  }

  const loadPrivacySettings = async () => {
    if (!featureFlags?.privacy_controls_enabled) return

    const { data: privacy } = await supabase
      .from('customer_privacy_settings')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    setPrivacySettings(privacy)
  }

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'addresses':
        setIsAddressBookOpen(true)
        break
      case 'prescriptions':
        setActiveTab('prescriptions')
        break
      case 'wallet':
        setActiveTab('wallet')
        break
      case 'loyalty':
        setActiveTab('loyalty')
        break
      case 'settings':
        setActiveTab('settings')
        break
      default:
        toast.info('Feature coming soon!')
    }
  }

  const getOrderStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (!featureFlags?.customer_dashboard_enabled) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Customer dashboard is not available</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {customer?.full_name || 'Customer'}!</h1>
          <p className="text-muted-foreground">Manage your account and orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">₹{stats.totalSpent}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </CardContent>
            </Card>
          </motion.div>

          {featureFlags?.loyalty_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Gift className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.loyaltyPoints}</p>
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {featureFlags?.wallet_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Wallet className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">₹{stats.walletBalance}</p>
                  <p className="text-xs text-muted-foreground">Wallet Balance</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {featureFlags?.wishlist_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 mx-auto text-pink-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.activeWishlist}</p>
                  <p className="text-xs text-muted-foreground">Wishlist Items</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {featureFlags?.address_book_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.savedAddresses}</p>
                  <p className="text-xs text-muted-foreground">Saved Addresses</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleQuickAction(action.id)}
                  className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Orders</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('orders')}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-sm">₹{order.total_amount}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getOrderStatusColor(order.status)} border-0`}>
                            {order.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="ml-2"
                          >
                            Track
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Wishlist Items */}
            {featureFlags?.wishlist_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Wishlist</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('wishlist')}
                    >
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="grid grid-cols-2 gap-3">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-2">
                          <div className="aspect-square bg-gray-100 rounded mb-2">
                            {item.product?.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{item.product?.name}</p>
                          <p className="text-sm text-green-600">₹{item.product?.selling_price}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {selectedOrderId ? (
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedOrderId(null)}
                className="mb-4"
              >
                ← Back to Orders
              </Button>
              <OrderTimeline 
                orderId={selectedOrderId} 
                tenantId={tenantId}
                showActions={true}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'PPP')}
                          </p>
                          <p className="text-sm">{order.order_items?.length || 0} items • ₹{order.total_amount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getOrderStatusColor(order.status)} border-0`}>
                          {order.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          {featureFlags?.wishlist_enabled ? (
            <Card>
              <CardHeader>
                <CardTitle>My Wishlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlistItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="aspect-square bg-gray-100 rounded mb-3">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1">{item.product?.name}</h4>
                        <p className="text-sm text-green-600 mb-2">₹{item.product?.selling_price}</p>
                        <Button size="sm" className="w-full">Add to Cart</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Wishlist feature is not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions">
          {featureFlags?.prescription_archive_enabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescription Archive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{prescription.doctor_name || 'Prescription'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(prescription.prescription_date), 'PPP')}
                        </p>
                        {prescription.notes && (
                          <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {prescription.is_recurring && (
                          <Badge variant="secondary">Recurring</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Prescription archive is not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <p className="text-muted-foreground">{customer?.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-muted-foreground">{customer?.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p className="text-muted-foreground">{customer?.phone || 'Not provided'}</p>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </CardContent>
            </Card>

            {featureFlags?.privacy_controls_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Processing Consent</span>
                      <Badge variant={privacySettings?.data_processing_consent ? 'default' : 'secondary'}>
                        {privacySettings?.data_processing_consent ? 'Granted' : 'Not Granted'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing Communications</span>
                      <Badge variant={privacySettings?.marketing_consent ? 'default' : 'secondary'}>
                        {privacySettings?.marketing_consent ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Analytics Tracking</span>
                      <Badge variant={privacySettings?.analytics_consent ? 'default' : 'secondary'}>
                        {privacySettings?.analytics_consent ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline">Manage Privacy</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Address Book Modal */}
      {featureFlags?.address_book_enabled && (
        <AddressBook
          tenantId={tenantId}
          customerId={customerId}
          isOpen={isAddressBookOpen}
          onClose={() => setIsAddressBookOpen(false)}
        />
      )}
    </div>
  )
}

export default CustomerDashboard
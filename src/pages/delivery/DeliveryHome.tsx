import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../lib/useAuth'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle, 
  Clock, 
  SignOut,
  Compass,
  Camera
} from '@phosphor-icons/react'
import { Order } from '../../types'
import { toast } from 'sonner'

const OrderCard = ({ 
  order, 
  onStartDelivery, 
  onMarkDelivered 
}: { 
  order: Order
  onStartDelivery: (orderId: string) => void
  onMarkDelivered: (orderId: string) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return 'default'
      case 'delivered':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
          <Badge variant={getStatusColor(order.status)}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          {order.customer?.full_name || 'Guest Customer'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            Delivery Address:
          </div>
          <div className="pl-4">
            {typeof order.delivery_address === 'object' && order.delivery_address ? (
              <div>
                {order.delivery_address.address}<br />
                {order.delivery_address.city}, {order.delivery_address.pincode}
              </div>
            ) : (
              'Address not available'
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Amount: ₹{order.final_amount}</div>
            <div className="text-muted-foreground">Payment: {order.payment_method}</div>
          </div>
          
          <div className="flex gap-2">
            {order.status === 'packed' && (
              <Button 
                size="sm" 
                onClick={() => onStartDelivery(order.id)}
                className="flex items-center gap-1"
              >
                <Compass className="h-3 w-3" />
                Start Delivery
              </Button>
            )}
            
            {order.status === 'out_for_delivery' && (
              <Button 
                size="sm" 
                onClick={() => onMarkDelivered(order.id)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Mark Delivered
              </Button>
            )}
          </div>
        </div>

        {order.delivery_otp && order.status === 'out_for_delivery' && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Delivery OTP:</div>
            <div className="text-2xl font-mono font-bold text-primary">
              {order.delivery_otp}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const DeliveryHome = () => {
  const { profile, signOut } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(false)

  useEffect(() => {
    loadAssignedOrders()
    requestLocation()
  }, [])

  const loadAssignedOrders = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .eq('assigned_to', profile?.id)
        .in('status', ['packed', 'out_for_delivery'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationEnabled(true)
        },
        (error) => {
          console.warn('Location access denied:', error)
          setLocationEnabled(false)
        }
      )
    }
  }

  const startDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'out_for_delivery',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Delivery started')
      loadAssignedOrders()

      if (locationEnabled) {
        startLocationTracking(orderId)
      }
    } catch (error) {
      console.error('Error starting delivery:', error)
      toast.error('Failed to start delivery')
    }
  }

  const markDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Order marked as delivered')
      loadAssignedOrders()
    } catch (error) {
      console.error('Error marking delivered:', error)
      toast.error('Failed to mark as delivered')
    }
  }

  const startLocationTracking = (orderId: string) => {
    if (!locationEnabled) return

    const trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await supabase.from('delivery_events').insert({
              order_id: orderId,
              delivery_person_id: profile?.id,
              event_type: 'location_update',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          } catch (error) {
            console.error('Error sending location update:', error)
          }
        },
        (error) => {
          console.error('Location tracking error:', error)
        }
      )
    }, 30000) // Update every 30 seconds

    // Store interval to clear later
    setTimeout(() => {
      clearInterval(trackingInterval)
    }, 4 * 60 * 60 * 1000) // Stop after 4 hours
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Please configure Supabase to access the delivery portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/health">Check Configuration</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const outForDeliveryOrders = orders.filter(o => o.status === 'out_for_delivery')
  const packedOrders = orders.filter(o => o.status === 'packed')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-xl">Pulss Delivery</span>
              <div className="text-sm text-muted-foreground">
                {profile?.full_name || 'Delivery Partner'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${locationEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {locationEnabled ? 'GPS Active' : 'GPS Disabled'}
              </span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={signOut}>
              <SignOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Your Deliveries</h1>
          <p className="text-muted-foreground">
            Manage your assigned delivery orders
          </p>
        </div>

        {!locationEnabled && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">Location Access Required</div>
                  <div className="text-sm text-yellow-700">
                    Enable location services for real-time tracking during deliveries
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outForDeliveryOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packedOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Orders Assigned</h3>
              <p className="text-muted-foreground">
                Orders assigned to you will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStartDelivery={startDelivery}
                onMarkDelivered={markDelivered}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
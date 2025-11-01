import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { 
  ShoppingCart, 
  CheckCircle, 
  Package, 
  Truck, 
  User, 
  MapPin,
  Clock,
  Phone,
  ChatCircle
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'assigned_to_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled'
  total: number
  payment_method: string
  payment_status: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  assigned_to?: string
  estimated_delivery?: string
  created_at: string
  updated_at: string
  order_items?: {
    quantity: number
    unit_price: number
    products: {
      name: string
      requires_rx: boolean
    }
  }[]
  delivery_staff?: {
    name: string
    phone: string
    avatar_url?: string
  }
  prescriptions?: {
    id: string
    file_url: string
    status: 'pending' | 'approved' | 'rejected'
    pharmacist_notes?: string
  }[]
}

interface OrderStatusTrackerProps {
  orderId: string
  role: 'customer' | 'admin' | 'delivery'
}

const ORDER_STATUSES = [
  { 
    key: 'pending', 
    label: 'Order Placed', 
    icon: ShoppingCart, 
    color: 'text-blue-600 bg-blue-50',
    description: 'Your order has been received and is being reviewed'
  },
  { 
    key: 'confirmed', 
    label: 'Confirmed', 
    icon: CheckCircle, 
    color: 'text-green-600 bg-green-50',
    description: 'Order confirmed and being prepared'
  },
  { 
    key: 'preparing', 
    label: 'Preparing', 
    icon: Package, 
    color: 'text-orange-600 bg-orange-50',
    description: 'Your medicines are being packed'
  },
  { 
    key: 'ready_for_pickup', 
    label: 'Ready for Pickup', 
    icon: Package, 
    color: 'text-purple-600 bg-purple-50',
    description: 'Order is ready and waiting for delivery assignment'
  },
  { 
    key: 'assigned_to_delivery', 
    label: 'Assigned to Delivery', 
    icon: User, 
    color: 'text-indigo-600 bg-indigo-50',
    description: 'Delivery person has been assigned'
  },
  { 
    key: 'out_for_delivery', 
    label: 'Out for Delivery', 
    icon: Truck, 
    color: 'text-blue-600 bg-blue-50',
    description: 'Your order is on the way'
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    icon: CheckCircle, 
    color: 'text-green-600 bg-green-50',
    description: 'Order successfully delivered'
  }
]

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  orderId,
  role
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (name, requires_rx)
          ),
          delivery_staff:profiles!assigned_to (
            name,
            phone,
            avatar_url
          ),
          prescriptions (
            id,
            file_url,
            status,
            pharmacist_notes
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: Order['status']) => {
    if (!order) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      toast.success(`Order status updated to ${ORDER_STATUSES.find(s => s.key === newStatus)?.label}`)

      // Send notification to customer
      if (role === 'admin') {
        // Here you would implement push notification logic
        console.log('Sending notification to customer about status update')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const getCurrentStatusIndex = () => {
    if (!order) return -1
    return ORDER_STATUSES.findIndex(status => status.key === order.status)
  }

  useEffect(() => {
    fetchOrder()

    // Set up real-time subscription for order updates
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null)
          
          // Show notification for status changes
          if (role === 'customer') {
            const newStatus = ORDER_STATUSES.find(s => s.key === payload.new.status)
            if (newStatus) {
              toast.success(`Order Update: ${newStatus.label}`, {
                description: newStatus.description
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId, role])

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="animate-pulse h-4 bg-muted rounded w-1/3"></div>
            <div className="animate-pulse h-20 bg-muted rounded"></div>
            <div className="animate-pulse h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Order not found</p>
        </CardContent>
      </Card>
    )
  }

  const currentStatusIndex = getCurrentStatusIndex()

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Order #{order.id.slice(-8).toUpperCase()}
                <Badge 
                  variant={order.status === 'delivered' ? 'default' : 'secondary'}
                  className={ORDER_STATUSES.find(s => s.key === order.status)?.color}
                >
                  {ORDER_STATUSES.find(s => s.key === order.status)?.label}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Placed on {format(new Date(order.created_at), 'PPp')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">₹{order.total}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {order.payment_method} • {order.payment_status}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Customer Details</h4>
              <div className="space-y-1 text-sm">
                <p>{order.customer_name}</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.customer_phone}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{order.delivery_address}</span>
                </p>
              </div>
            </div>
            
            {order.delivery_staff && (
              <div>
                <h4 className="font-medium mb-2">Delivery Person</h4>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={order.delivery_staff.avatar_url} />
                    <AvatarFallback>
                      {order.delivery_staff.name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.delivery_staff.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {order.delivery_staff.phone}
                    </p>
                  </div>
                  {role === 'customer' && (
                    <Button size="sm" variant="outline" className="ml-auto">
                      <ChatCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {order.estimated_delivery && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Estimated delivery: {format(new Date(order.estimated_delivery), 'PPp')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              const IconComponent = status.icon

              return (
                <div key={status.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                        ${isCompleted 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-background border-muted-foreground/30 text-muted-foreground'
                        }
                        ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                      `}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {index < ORDER_STATUSES.length - 1 && (
                      <div
                        className={`
                          w-0.5 h-12 mt-2 transition-colors
                          ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/20'}
                        `}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {status.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {status.description}
                        </p>
                      </div>
                      
                      {role === 'admin' && index === currentStatusIndex + 1 && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(status.key as Order['status'])}
                          disabled={updating}
                          className="ml-4"
                        >
                          {updating ? 'Updating...' : `Mark as ${status.label}`}
                        </Button>
                      )}
                    </div>
                    
                    {isCurrent && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Updated {format(new Date(order.updated_at), 'PPp')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Prescription Status */}
      {order.prescriptions && order.prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.prescriptions.map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <img 
                        src={prescription.file_url} 
                        alt="Prescription"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          ;(e.target as HTMLElement).nextElementSibling!.classList.remove('hidden')
                        }}
                      />
                      <Package className="h-6 w-6 text-muted-foreground hidden" />
                    </div>
                    <div>
                      <p className="font-medium">Prescription Document</p>
                      <Badge 
                        variant={
                          prescription.status === 'approved' ? 'default' :
                          prescription.status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {prescription.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(prescription.file_url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
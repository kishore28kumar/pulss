import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/lib/useAuth'
import { realtimeService, type OrderRealtimeData } from '@/lib/realtime'
import { notificationService } from '@/lib/notifications'
import { 
  Bell, 
  BellRinging,
  Check, 
  X, 
  Package, 
  Truck, 
  MapPin,
  Phone,
  User,
  Clock,
  CreditCard,
  Receipt,
  Eye,
  SpeakerHigh,
  SpeakerX
} from '@phosphor-icons/react'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  total: number
  status: string
  payment_method: string
  payment_status: string
  credit_requested: boolean
  created_at: string
  order_items: Array<{
    id: string
    product_name: string
    quantity: number
    unit_price: number
    line_total: number
  }>
}

export const OrdersManagement = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [newOrderCount, setNewOrderCount] = useState(0)
  
  // Initialize notification services
  useEffect(() => {
    const initServices = async () => {
      await notificationService.initialize()
      await realtimeService.initialize(profile?.tenant_id || undefined)
    }
    
    if (profile?.tenant_id) {
      initServices()
    }
  }, [profile?.tenant_id])
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile?.tenant_id) return
    
    const handleNewOrder = (orderData: OrderRealtimeData) => {
      setNewOrderCount(prev => prev + 1)
      
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ['orders', profile.tenant_id] })
    }
    
    const handleOrderUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', profile.tenant_id] })
    }
    
    // Subscribe to custom events from realtime service
    const newOrderUnsubscribe = realtimeService.subscribeToCustomEvent('new-order', handleNewOrder)
    const orderUpdateUnsubscribe = realtimeService.subscribeToCustomEvent('order-status-update', handleOrderUpdate)
    
    return () => {
      newOrderUnsubscribe()
      orderUpdateUnsubscribe()
    }
  }, [profile?.tenant_id, queryClient])
  
  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            line_total,
            products (name)
          ),
          customers (name, phone)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      return data.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Guest Customer',
        customer_phone: order.customers?.phone || order.customer_phone,
        order_items: order.order_items.map((item: any) => ({
          ...item,
          product_name: item.products?.name || 'Unknown Product'
        }))
      })) as Order[]
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 30000 // Refresh every 30 seconds as backup
  })
  
  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, creditApproved }: { 
      orderId: string
      status: string
      creditApproved?: boolean 
    }) => {
      const updates: any = { status }
      if (creditApproved !== undefined) {
        updates.credit_approved = creditApproved
        if (creditApproved) {
          updates.payment_status = 'completed'
        }
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', profile?.tenant_id] })
      toast.success('Order updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message)
    }
  })
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'confirmed': return 'default' 
      case 'packed': return 'default'
      case 'shipped': return 'default'
      case 'out_for_delivery': return 'default'
      case 'delivered': return 'default'
      case 'cancelled': return 'destructive'
      case 'returned': return 'destructive'
      default: return 'secondary'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <Check className="w-4 h-4" />
      case 'packed': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'out_for_delivery': return <MapPin className="w-4 h-4" />
      case 'delivered': return <Check className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      case 'returned': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at).toDateString()
    const today = new Date().toDateString()
    return orderDate === today
  })
  
  return (
    <div className="space-y-6">
      {/* Header with notification controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <p className="text-muted-foreground">Manage customer orders and track deliveries</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <SpeakerHigh className="w-4 h-4" /> : <SpeakerX className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
          
          <Button variant="outline" size="sm" className="relative">
            {newOrderCount > 0 ? (
              <>
                <BellRinging className="w-4 h-4 text-orange-500" />
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {newOrderCount}
                </Badge>
              </>
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Notifications
          </Button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{pendingOrders.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">{todayOrders.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credit Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(o => o.credit_requested && !o.payment_status).length}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-green-600">{orders.length}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p>Orders will appear here when customers start placing them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">
                        #{order.id.slice(-8)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">₹{order.total}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{order.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{order.customer_phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{order.payment_method}</span>
                      {order.credit_requested && (
                        <Badge variant="outline" className="ml-2">Credit Requested</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-muted-foreground">
                    <strong>Items:</strong> {order.order_items.map(item => 
                      `${item.product_name} (${item.quantity}x)`
                    ).join(', ')}
                  </div>
                  
                  {/* Quick Actions */}
                  {order.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: 'confirmed'
                        })}
                        disabled={updateOrderMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirm Order
                      </Button>
                      
                      {order.credit_requested && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderMutation.mutate({
                            orderId: order.id,
                            status: 'confirmed',
                            creditApproved: true
                          })}
                          disabled={updateOrderMutation.isPending}
                        >
                          Approve Credit
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: 'cancelled'
                        })}
                        disabled={updateOrderMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: 'packed'
                        })}
                        disabled={updateOrderMutation.isPending}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Mark as Packed
                      </Button>
                    </div>
                  )}
                  
                  {order.status === 'packed' && (
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: 'shipped'
                        })}
                        disabled={updateOrderMutation.isPending}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Mark as Shipped
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Order ID:</strong> #{selectedOrder.id.slice(-8)}
                </div>
                <div>
                  <strong>Status:</strong> {selectedOrder.status.replace('_', ' ').toUpperCase()}
                </div>
                <div>
                  <strong>Customer:</strong> {selectedOrder.customer_name}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedOrder.customer_phone}
                </div>
                <div className="col-span-2">
                  <strong>Address:</strong> {selectedOrder.customer_address}
                </div>
                <div>
                  <strong>Payment:</strong> {selectedOrder.payment_method}
                </div>
                <div>
                  <strong>Total:</strong> ₹{selectedOrder.total}
                </div>
              </div>
              
              <div>
                <strong className="text-sm">Items Ordered:</strong>
                <div className="mt-2 space-y-2">
                  {selectedOrder.order_items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span>₹{item.line_total}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div>
                  <strong className="text-sm">Update Status:</strong>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(status) => {
                      updateOrderMutation.mutate({
                        orderId: selectedOrder.id,
                        status
                      })
                      setSelectedOrder(null)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
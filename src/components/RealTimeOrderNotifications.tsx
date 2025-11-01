import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, ShoppingCart, Package, Truck, CheckCircle, Eye } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface OrderNotification {
  id: string
  order_id: string
  customer_name: string
  total: number
  status: string
  payment_method: string
  created_at: string
  items_count: number
  requires_rx: boolean
}

interface RealTimeOrderNotificationsProps {
  role: 'admin' | 'delivery'
  position?: 'fixed' | 'relative'
}

export const RealTimeOrderNotifications: React.FC<RealTimeOrderNotificationsProps> = ({
  role,
  position = 'fixed'
}) => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [visible, setVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Play notification sound
  const playNotificationSound = async () => {
    if (!soundEnabled) return

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/new-order.mp3')
        audioRef.current.volume = 0.7
      }
      
      // Reset and play
      audioRef.current.currentTime = 0
      await audioRef.current.play()
    } catch (error) {
      console.warn('Could not play notification sound:', error)
      
      // Fallback: browser notification sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: 'Click to view order details',
          icon: '/favicon.ico',
          tag: 'new-order'
        })
      }
    }
  }

  // Handle new order notification
  const handleNewOrder = (order: any) => {
    const notification: OrderNotification = {
      id: `${order.id}-${Date.now()}`,
      order_id: order.id,
      customer_name: order.customer_name,
      total: order.total,
      status: order.status,
      payment_method: order.payment_method,
      created_at: order.created_at,
      items_count: order.order_items?.length || 0,
      requires_rx: order.order_items?.some((item: any) => item.products?.requires_rx) || false
    }

    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only 5 most recent
    
    // Play sound and show toast
    playNotificationSound()
    
    toast.success('🛒 New Order Received!', {
      description: `Order from ${order.customer_name} - ₹${order.total}`,
      duration: 6000,
      action: {
        label: 'View Order',
        onClick: () => handleViewOrder(order.id)
      }
    })
  }

  // Handle order status update
  const handleOrderUpdate = (order: any) => {
    if (role === 'delivery' && order.status === 'assigned_to_delivery' && order.assigned_to === profile?.id) {
      toast.info('📦 New Delivery Assignment', {
        description: `You've been assigned order #${order.id.slice(-8).toUpperCase()}`,
        duration: 5000,
        action: {
          label: 'View Details',
          onClick: () => handleViewOrder(order.id)
        }
      })
      playNotificationSound()
    }
  }

  const handleViewOrder = (orderId: string) => {
    // Navigate to order details - you can customize this based on your routing
    const baseUrl = role === 'admin' ? '/admin/orders' : '/delivery/orders'
    window.location.href = `${baseUrl}/${orderId}`
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const dismissAll = () => {
    setNotifications([])
  }

  const toggleSound = () => {
    setSoundEnabled(prev => !prev)
    localStorage.setItem('order-notifications-sound', (!soundEnabled).toString())
  }

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile?.tenant_id) return

    // Load sound preference
    const savedSoundPref = localStorage.getItem('order-notifications-sound')
    if (savedSoundPref !== null) {
      setSoundEnabled(savedSoundPref === 'true')
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    let subscription: any

    if (role === 'admin') {
      // Subscribe to new orders for admin
      subscription = supabase
        .channel(`tenant-orders-${profile.tenant_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `tenant_id=eq.${profile.tenant_id}`
          },
          async (payload) => {
            // Fetch full order details including items
            const { data: orderData } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  quantity,
                  products (name, requires_rx)
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (orderData) {
              handleNewOrder(orderData)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `tenant_id=eq.${profile.tenant_id}`
          },
          (payload) => {
            handleOrderUpdate(payload.new)
          }
        )
        .subscribe()
    } else if (role === 'delivery') {
      // Subscribe to orders assigned to this delivery person
      subscription = supabase
        .channel(`delivery-orders-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `assigned_to=eq.${profile.id}`
          },
          (payload) => {
            handleOrderUpdate(payload.new)
          }
        )
        .subscribe()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [profile?.id, profile?.tenant_id, role, soundEnabled])

  if (!visible || notifications.length === 0) {
    return (
      <div className={position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setVisible(true)}
          className="shadow-lg"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-2 px-1 min-w-[20px] h-5">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case 'confirmed':
      case 'preparing':
        return <Package className="h-4 w-4 text-orange-600" />
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className={position === 'fixed' ? 'fixed top-4 right-4 z-50 w-80' : 'w-full'}>
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {role === 'admin' ? 'New Orders' : 'Delivery Updates'}
              </h3>
              <Badge variant="secondary" className="px-2 py-0.5">
                {notifications.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSound}
                className={`h-8 w-8 p-0 ${soundEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisible(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border animate-slide-up"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(notification.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {notification.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.items_count} items • ₹{notification.total}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          {notification.payment_method}
                        </Badge>
                        {notification.requires_rx && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            Rx Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.created_at), 'HH:mm')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1 ml-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewOrder(notification.order_id)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={dismissAll}
                className="w-full h-8 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
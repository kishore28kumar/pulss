import { supabase } from './supabase'
import { notificationService } from './notifications'
import { toast } from 'sonner'

export interface RealtimeNotification {
  id: string
  type: 'order_placed' | 'order_status' | 'payment_received' | 'low_stock' | 'customer_signup' | 'system_alert'
  title: string
  message: string
  data?: any
  tenant_id?: string
  user_id?: string
  created_at: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface OrderNotification {
  order_id: string
  customer_name: string
  total: number
  items_count: number
  payment_method: string
  status: string
  tenant_id: string
}

class RealtimeNotificationService {
  private subscriptions = new Map<string, any>()
  private audioContext: AudioContext | null = null
  private orderRingtone: AudioBuffer | null = null

  async initialize() {
    try {
      this.audioContext = new AudioContext()
      await this.loadOrderRingtone()
    } catch (error) {
      console.log('Audio initialization failed:', error)
    }
  }

  private async loadOrderRingtone() {
    try {
      const response = await fetch('/sounds/new-order.mp3')
      const arrayBuffer = await response.arrayBuffer()
      this.orderRingtone = await this.audioContext!.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.log('Failed to load order ringtone:', error)
    }
  }

  private playOrderRingtone() {
    if (this.audioContext && this.orderRingtone) {
      try {
        const source = this.audioContext.createBufferSource()
        source.buffer = this.orderRingtone
        source.connect(this.audioContext.destination)
        source.start(0)
      } catch (error) {
        console.log('Failed to play ringtone:', error)
      }
    }
  }

  // Subscribe to real-time order notifications for admin
  subscribeToOrderNotifications(tenantId: string, callback?: (order: OrderNotification) => void) {
    const channel = supabase
      .channel(`orders-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`
        },
        async (payload) => {
          const order = payload.new as any
          
          // Play ringtone
          this.playOrderRingtone()
          
          // Show toast notification
          toast.success(`New Order #${order.id.slice(-6)}`, {
            description: `${order.customer_name || 'Customer'} • ₹${order.total}`,
            action: {
              label: 'View',
              onClick: () => callback?.(order)
            },
            duration: 10000,
          })
          
          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(`New Order - ₹${order.total}`, {
              body: `Order from ${order.customer_name || 'Customer'}`,
              icon: '/favicon.ico',
              tag: `order-${order.id}`,
              requireInteraction: true
            })
          }

          // Send to callback
          callback?.(order)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const order = payload.new as any
          const oldOrder = payload.old as any
          
          if (order.status !== oldOrder.status) {
            toast.info(`Order Status Updated`, {
              description: `Order #${order.id.slice(-6)} is now ${order.status}`,
              duration: 5000,
            })
          }
        }
      )
      .subscribe()

    this.subscriptions.set(`orders-${tenantId}`, channel)
    return channel
  }

  // Subscribe to customer order updates
  subscribeToCustomerOrderUpdates(userId: string, callback?: (order: any) => void) {
    const channel = supabase
      .channel(`customer-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const order = payload.new as any
          const oldOrder = payload.old as any
          
          if (order.status !== oldOrder.status) {
            const statusMessages = {
              'confirmed': 'Your order has been confirmed!',
              'packed': 'Your order is being packed',
              'shipped': 'Your order has been shipped',
              'out_for_delivery': 'Your order is out for delivery',
              'delivered': 'Your order has been delivered!'
            }
            
            toast.success('Order Update', {
              description: statusMessages[order.status as keyof typeof statusMessages] || `Status: ${order.status}`,
              duration: 8000,
            })
          }
          
          callback?.(order)
        }
      )
      .subscribe()

    this.subscriptions.set(`customer-orders-${userId}`, channel)
    return channel
  }

  // Subscribe to low stock alerts
  subscribeToLowStockAlerts(tenantId: string, callback?: (item: any) => void) {
    const channel = supabase
      .channel(`low-stock-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const inventory = payload.new as any
          
          if (inventory.quantity <= (inventory.reorder_level || 10)) {
            toast.warning('Low Stock Alert', {
              description: `${inventory.product_name || 'Product'} is running low (${inventory.quantity} remaining)`,
              duration: 10000,
            })
            
            callback?.(inventory)
          }
        }
      )
      .subscribe()

    this.subscriptions.set(`low-stock-${tenantId}`, channel)
    return channel
  }

  // Subscribe to customer signups for admin
  subscribeToCustomerSignups(tenantId: string, callback?: (customer: any) => void) {
    const channel = supabase
      .channel(`customers-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const customer = payload.new as any
          
          toast.success('New Customer Registered', {
            description: `${customer.name || customer.phone} joined your store`,
            duration: 5000,
          })
          
          callback?.(customer)
        }
      )
      .subscribe()

    this.subscriptions.set(`customers-${tenantId}`, channel)
    return channel
  }

  // Subscribe to system-wide alerts for super admin
  subscribeToSystemAlerts(callback?: (alert: any) => void) {
    const channel = supabase
      .channel('system-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_alerts'
        },
        (payload) => {
          const alert = payload.new as any
          
          toast.error('System Alert', {
            description: alert.message,
            duration: 15000,
          })
          
          callback?.(alert)
        }
      )
      .subscribe()

    this.subscriptions.set('system-alerts', channel)
    return channel
  }

  // Unsubscribe from notifications
  unsubscribe(subscriptionKey: string) {
    const channel = this.subscriptions.get(subscriptionKey)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(subscriptionKey)
    }
  }

  // Unsubscribe from all
  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.subscriptions.clear()
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission()
    }
    return 'denied'
  }

  // Send custom notification
  async sendCustomNotification(notification: Partial<RealtimeNotification>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          created_at: new Date().toISOString(),
          read: false
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Get unread notifications count
  async getUnreadCount(userId: string, tenantId?: string): Promise<number> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }
}

export const realtimeNotificationService = new RealtimeNotificationService()

// Initialize on first import
realtimeNotificationService.initialize()
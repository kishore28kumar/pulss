import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface NotificationConfig {
  enableSound?: boolean
  soundFile?: string
  enableToast?: boolean
  enableBrowser?: boolean
}

export const useOrderNotifications = (config: NotificationConfig = {}) => {
  const { user, profile } = useAuth()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const {
    enableSound = true,
    soundFile = '/sounds/new-order.mp3',
    enableToast = true,
    enableBrowser = true
  } = config

  // Initialize audio
  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio(soundFile)
      audioRef.current.preload = 'auto'
    }
  }, [enableSound, soundFile])

  // Setup real-time subscription
  useEffect(() => {
    if (!user || !profile) return

    // Only admins and super admins get order notifications
    if (profile.role !== 'admin' && profile.role !== 'super_admin') return

    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: profile.role === 'admin' ? `tenant_id=eq.${profile.tenant_id}` : undefined
        },
        async (payload) => {
          const order = payload.new as any

          // Play notification sound
          if (enableSound && audioRef.current) {
            try {
              await audioRef.current.play()
            } catch (error) {
              console.warn('Could not play notification sound:', error)
            }
          }

          // Show toast notification
          if (enableToast) {
            toast.success('New Order Received!', {
              description: `Order #${order.id.slice(-8)} - ₹${order.total}`,
              action: {
                label: 'View Order',
                onClick: () => {
                  // This could navigate to the order details
                  window.location.href = `/admin/orders/${order.id}`
                }
              },
              duration: 10000
            })
          }

          // Show browser notification
          if (enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('New Order Received!', {
              body: `Order #${order.id.slice(-8)} - ₹${order.total}`,
              icon: '/icons/order-notification.png',
              tag: `order-${order.id}`,
              requireInteraction: true
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, enableSound, enableToast, enableBrowser])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }

  return {
    requestNotificationPermission
  }
}

export const useCustomerNotifications = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('customer-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          const order = payload.new as any
          const oldOrder = payload.old as any

          if (oldOrder.status !== order.status) {
            let message = ''
            switch (order.status) {
              case 'confirmed':
                message = 'Your order has been confirmed!'
                break
              case 'packed':
                message = 'Your order is being packed'
                break
              case 'shipped':
                message = 'Your order has been shipped'
                break
              case 'out_for_delivery':
                message = 'Your order is out for delivery'
                break
              case 'delivered':
                message = 'Your order has been delivered!'
                break
              case 'cancelled':
                message = 'Your order has been cancelled'
                break
              default:
                message = 'Order status updated'
            }

            toast.info('Order Update', {
              description: `${message} - Order #${order.id.slice(-8)}`,
              duration: 5000
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
}
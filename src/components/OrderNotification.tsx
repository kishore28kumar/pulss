import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Bell, Phone, ChatCircle, CheckCircle, X } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  total: number
  payment_method: string
  created_at: string
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
  }>
}

export const OrderNotification = () => {
  const { profile } = useAuth()
  const [newOrders, setNewOrders] = useState<Order[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Play notification sound
  const playNotificationSound = () => {
    if (isPlaying) return
    setIsPlaying(true)
    
    // Create audio context for ringtone
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create a simple ringtone using Web Audio API
    const playTone = (frequency: number, duration: number, startTime: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }
    
    // Play a simple ringtone pattern
    const now = audioContext.currentTime
    playTone(800, 0.4, now)
    playTone(600, 0.4, now + 0.5)
    playTone(800, 0.4, now + 1)
    playTone(600, 0.4, now + 1.5)
    
    setTimeout(() => setIsPlaying(false), 2000)
  }

  // Listen for new orders (Admin/Staff only)
  useEffect(() => {
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return
    }

    // Subscribe to new orders
    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        async (payload) => {
          // Fetch full order details
          const { data: orderDetails, error } = await supabase
            .from('orders')
            .select(`
              *,
              customers!inner(name, phone),
              order_items!inner(
                quantity,
                unit_price,
                products!inner(name)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && orderDetails) {
            const order: Order = {
              id: orderDetails.id,
              order_number: orderDetails.order_number,
              customer_name: orderDetails.customers.name,
              customer_phone: orderDetails.customers.phone,
              total: orderDetails.total,
              payment_method: orderDetails.payment_method,
              created_at: orderDetails.created_at,
              items: orderDetails.order_items.map((item: any) => ({
                product_name: item.products.name,
                quantity: item.quantity,
                unit_price: item.unit_price
              }))
            }

            setNewOrders(prev => [...prev, order])
            setCurrentOrder(order)
            setShowModal(true)
            
            // Play notification sound
            playNotificationSound()
            
            // Show toast notification
            toast.success('New order received! 🔔', {
              description: `Order #${order.order_number} from ${order.customer_name}`,
              action: {
                label: 'View',
                onClick: () => {
                  setCurrentOrder(order)
                  setShowModal(true)
                }
              }
            })

            // Browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Order Received', {
                body: `Order #${order.order_number} from ${order.customer_name} - ₹${order.total}`,
                icon: '/manifest.json', // You can add a custom icon here
                tag: `order-${order.id}`
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const acceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile?.id
        })
        .eq('id', orderId)

      if (!error) {
        toast.success('Order confirmed!')
        setNewOrders(prev => prev.filter(order => order.id !== orderId))
        setShowModal(false)
      }
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }

  const callCustomer = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  const messageCustomer = (phoneNumber: string, orderNumber: string) => {
    if (phoneNumber) {
      const message = encodeURIComponent(`Hello! Your order #${orderNumber} has been confirmed. We'll prepare it shortly.`)
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    }
  }

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return null
  }

  return (
    <>
      {/* Notification Badge */}
      {newOrders.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => {
              if (newOrders.length > 0) {
                setCurrentOrder(newOrders[0])
                setShowModal(true)
              }
            }}
            className="relative animate-bounce bg-red-500 hover:bg-red-600"
          >
            <Bell className="h-4 w-4 mr-2" />
            {newOrders.length} New Order{newOrders.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Bell className="h-5 w-5 mr-2" />
              New Order Alert!
            </DialogTitle>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Order #{currentOrder.order_number}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{currentOrder.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{currentOrder.customer_phone}</p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{currentOrder.total}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentOrder.payment_method}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Items:</p>
                    <div className="space-y-1">
                      {currentOrder.items.map((item, index) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span>₹{item.unit_price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => callCustomer(currentOrder.customer_phone)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      onClick={() => messageCustomer(currentOrder.customer_phone, currentOrder.order_number)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ChatCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => acceptOrder(currentOrder.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Order
                    </Button>
                    <Button
                      onClick={() => {
                        setNewOrders(prev => prev.filter(order => order.id !== currentOrder.id))
                        setShowModal(false)
                      }}
                      variant="outline"
                      size="icon"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
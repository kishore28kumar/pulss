import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrderStatusTracker } from '@/components/OrderStatusTracker'
import { RealTimeOrderNotifications } from '@/components/RealTimeOrderNotifications'
import { ArrowLeft, Phone, ChatCircle, MapPin } from '@phosphor-icons/react'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Order {
  id: string
  status: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  total: number
  payment_method: string
  created_at: string
  estimated_delivery?: string
  tracking_enabled?: boolean
  delivery_staff?: {
    name: string
    phone: string
    avatar_url?: string
  }
}

export const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = async () => {
    if (!orderId) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_staff:profiles!assigned_to (
            name,
            phone,
            avatar_url
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Order not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleContactDelivery = () => {
    if (order?.delivery_staff?.phone) {
      const whatsappUrl = `https://wa.me/${order.delivery_staff.phone.replace(/[^0-9]/g, '')}?text=Hi, I'm contacting about my order ${order.id.slice(-8).toUpperCase()}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleContactStore = () => {
    // This would be the store's WhatsApp number from chemist_settings
    toast.info('Contacting store...', {
      description: 'Opening WhatsApp to contact the store'
    })
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Store
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Track Your Order</h1>
                <p className="text-sm text-muted-foreground">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {order.delivery_staff && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleContactDelivery}
                  className="gap-2"
                >
                  <ChatCircle className="h-4 w-4" />
                  Contact Delivery
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleContactStore}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Contact Store
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Order Status Tracker */}
          <OrderStatusTracker orderId={order.id} role="customer" />

          {/* Live Tracking Map Placeholder */}
          {order.tracking_enabled && order.status === 'out_for_delivery' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Live tracking will be available here when Google Maps API is configured
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your delivery person is on the way!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help & Support */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Order Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    If you have any issues with your order, please contact our store directly.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleContactStore}>
                    Contact Store
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Delivery Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Get real-time updates about your delivery status and location.
                  </p>
                  {order.delivery_staff ? (
                    <Button variant="outline" size="sm" onClick={handleContactDelivery}>
                      Contact Delivery Person
                    </Button>
                  ) : (
                    <Badge variant="secondary">Delivery not assigned yet</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
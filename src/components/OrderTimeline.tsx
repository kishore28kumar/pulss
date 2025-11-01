import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  AlertCircle,
  Download,
  MessageSquare,
  Phone,
  Star,
  Calendar,
  User
} from '@phosphor-icons/react'
import { format, formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { OrderEvent, Order, OrderInvoice, FeatureFlags } from '@/types'
import { toast } from 'sonner'

interface OrderTimelineProps {
  orderId: string
  tenantId: string
  showActions?: boolean
  compact?: boolean
}

interface TimelineEvent {
  id: string
  type: 'order' | 'system' | 'user'
  status: string
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<any>
  color: string
  data?: any
  created_by?: string
}

const ORDER_STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-100',
    title: 'Order Placed',
    description: 'Your order has been placed and is being reviewed'
  },
  confirmed: {
    icon: CheckCircle,
    color: 'text-blue-600 bg-blue-100',
    title: 'Order Confirmed',
    description: 'Your order has been confirmed and is being prepared'
  },
  packed: {
    icon: Package,
    color: 'text-indigo-600 bg-indigo-100',
    title: 'Order Packed',
    description: 'Your order has been packed and is ready for dispatch'
  },
  shipped: {
    icon: Truck,
    color: 'text-purple-600 bg-purple-100',
    title: 'Order Shipped',
    description: 'Your order is on its way to you'
  },
  out_for_delivery: {
    icon: MapPin,
    color: 'text-orange-600 bg-orange-100',
    title: 'Out for Delivery',
    description: 'Your order is out for delivery and will arrive soon'
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
    title: 'Order Delivered',
    description: 'Your order has been successfully delivered'
  },
  cancelled: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-100',
    title: 'Order Cancelled',
    description: 'Your order has been cancelled'
  },
  returned: {
    icon: Package,
    color: 'text-gray-600 bg-gray-100',
    title: 'Order Returned',
    description: 'Your order has been returned'
  }
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  orderId,
  tenantId,
  showActions = true,
  compact = false
}) => {
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)

  useEffect(() => {
    loadFeatureFlags()
    loadOrderData()
  }, [orderId])

  const loadFeatureFlags = async () => {
    try {
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      setFeatureFlags(flags)
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const loadOrderData = async () => {
    setLoading(true)
    try {
      // Load order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      // Load order events if timeline is enabled
      if (featureFlags?.order_timeline_enabled) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('order_events')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        // Transform events into timeline format
        const timelineEvents: TimelineEvent[] = eventsData?.map(event => {
          const statusConfig = ORDER_STATUS_CONFIG[event.event_type as keyof typeof ORDER_STATUS_CONFIG] || 
            ORDER_STATUS_CONFIG.pending

          return {
            id: event.id,
            type: 'system' as const,
            status: event.event_type,
            title: statusConfig.title,
            description: event.event_description || statusConfig.description,
            timestamp: event.created_at,
            icon: statusConfig.icon,
            color: statusConfig.color,
            data: event.event_data,
            created_by: event.created_by
          }
        }) || []

        setEvents(timelineEvents)
      }

      // Load invoice if download is enabled
      if (featureFlags?.invoice_download_enabled) {
        const { data: invoiceData } = await supabase
          .from('order_invoices')
          .select('*')
          .eq('order_id', orderId)
          .single()

        setInvoice(invoiceData)
      }
    } catch (error) {
      console.error('Error loading order data:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!invoice?.invoice_url) {
      toast.error('Invoice not available')
      return
    }

    try {
      // In a real app, this would download from the stored URL
      // For now, we'll generate a PDF or redirect to the invoice URL
      window.open(invoice.invoice_url, '_blank')
      toast.success('Invoice download started')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const getCurrentStatus = () => {
    if (!order) return 'pending'
    return order.status
  }

  const getStatusProgress = () => {
    const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']
    const currentStatus = getCurrentStatus()
    const currentIndex = statusOrder.indexOf(currentStatus)
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  const getExpectedDeliveryTime = () => {
    if (!order) return null
    
    // This would typically be calculated based on delivery slot selection
    // For now, we'll estimate based on order creation time
    const orderDate = new Date(order.created_at)
    const currentStatus = getCurrentStatus()
    
    switch (currentStatus) {
      case 'pending':
      case 'confirmed':
        return new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days
      case 'packed':
      case 'shipped':
        return new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day
      case 'out_for_delivery':
        return new Date(orderDate.getTime() + 4 * 60 * 60 * 1000) // 4 hours
      default:
        return null
    }
  }

  if (!featureFlags?.order_timeline_enabled) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Order not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStatusConfig = ORDER_STATUS_CONFIG[getCurrentStatus() as keyof typeof ORDER_STATUS_CONFIG]
  const expectedDelivery = getExpectedDeliveryTime()

  return (
    <div className="space-y-4">
      {/* Order Status Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Order #{order.id.slice(-8).toUpperCase()}
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${currentStatusConfig?.color} border-0 text-sm px-3 py-1`}
            >
              {currentStatusConfig?.title}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Order Progress</span>
              <span>{Math.round(getStatusProgress())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${getStatusProgress()}%` }}
              />
            </div>
          </div>

          {/* Expected Delivery */}
          {expectedDelivery && getCurrentStatus() !== 'delivered' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Expected delivery: {format(expectedDelivery, 'PPP')}
            </div>
          )}

          {/* Order Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-2">
              {featureFlags?.invoice_download_enabled && invoice && (
                <Button
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </Button>
              )}
              
              {featureFlags?.chat_support_enabled && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </Button>
              )}

              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Store
              </Button>

              {getCurrentStatus() === 'delivered' && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rate Order
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No timeline events available</p>
            </div>
          ) : (
            <ScrollArea className={compact ? "h-64" : "h-96"}>
              <div className="space-y-4">
                <AnimatePresence>
                  {events.map((event, index) => {
                    const Icon = event.icon
                    const isLast = index === events.length - 1

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative flex items-start gap-4"
                      >
                        {/* Timeline Line */}
                        {!isLast && (
                          <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                        )}

                        {/* Event Icon */}
                        <div className={`p-3 rounded-full ${event.color} flex-shrink-0 shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Event Content */}
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{event.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                              
                              {/* Additional event data */}
                              {event.data && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-muted-foreground">
                                  {typeof event.data === 'object' 
                                    ? Object.entries(event.data).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="font-medium">{key}:</span> {String(value)}
                                        </div>
                                      ))
                                    : event.data
                                  }
                                </div>
                              )}

                              {/* Event creator */}
                              {event.created_by && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  Updated by staff
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground text-right flex-shrink-0 ml-2">
                              <div>{format(new Date(event.timestamp), 'MMM d, yyyy')}</div>
                              <div>{format(new Date(event.timestamp), 'h:mm a')}</div>
                              <div className="mt-1 text-muted-foreground/60">
                                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Order Details Summary */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">{format(new Date(order.created_at), 'PPP')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">₹{order.total_amount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{order.payment_method}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Items</p>
                <p className="font-medium">{order.order_items?.length || 0} items</p>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    {typeof order.delivery_address === 'object' ? (
                      <div>
                        <p>{order.delivery_address.name}</p>
                        <p>{order.delivery_address.address}</p>
                        <p>{order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</p>
                        <p>Phone: {order.delivery_address.phone}</p>
                      </div>
                    ) : (
                      <p>{order.delivery_address}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OrderTimeline
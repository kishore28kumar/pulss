import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Package, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface OrderTracking {
  order: {
    order_id: string
    status: string
    total_amount: number
    customer_name: string
    customer_phone: string
    created_at: string
  }
  timeline: Array<{
    status_history_id: string
    status: string
    notes: string
    updated_at: string
  }>
  locations: Array<{
    tracking_location_id: string
    latitude: number
    longitude: number
    accuracy: number
    recorded_at: string
  }>
}

interface Props {
  orderId: string
}

export const OrderTrackingView: React.FC<Props> = ({ orderId }) => {
  const [tracking, setTracking] = useState<OrderTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/tracking/${orderId}`)
      const data = await response.json()
      
      if (data.success) {
        setTracking(data)
      } else {
        toast.error('Failed to load tracking data')
      }
    } catch (error) {
      console.error('Error fetching tracking:', error)
      toast.error('Failed to load tracking data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTracking()
  }

  useEffect(() => {
    fetchTracking()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTracking, 30000)
    return () => clearInterval(interval)
  }, [orderId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    )
  }

  if (!tracking) return null

  const statusConfig = {
    pending: { label: 'Order Placed', color: 'bg-gray-500', icon: Package },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle },
    preparing: { label: 'Preparing', color: 'bg-yellow-500', icon: Clock },
    ready: { label: 'Ready', color: 'bg-green-500', icon: CheckCircle },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-500', icon: MapPin },
    delivered: { label: 'Delivered', color: 'bg-green-600', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: Package },
  }

  const currentStatus = statusConfig[tracking.order.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="space-y-6">
      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order #{tracking.order.order_id.slice(-8).toUpperCase()}</CardTitle>
              <CardDescription>
                {tracking.order.customer_name} · {tracking.order.customer_phone}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${currentStatus.color} rounded-full flex items-center justify-center`}>
              <currentStatus.icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStatus.label}</p>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(tracking.timeline[tracking.timeline.length - 1]?.updated_at || tracking.order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
          <CardDescription>Track the progress of your order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tracking.timeline.map((item, index) => {
              const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending
              const isLast = index === tracking.timeline.length - 1
              
              return (
                <div key={item.status_history_id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center ${isLast ? 'ring-4 ring-offset-2 ring-primary/20' : ''}`}>
                      <config.icon className="h-5 w-5 text-white" />
                    </div>
                    {index < tracking.timeline.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold">{config.label}</p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Location History (if available) */}
      {tracking.locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Updates
            </CardTitle>
            <CardDescription>
              {tracking.locations.length} location update{tracking.locations.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracking.locations.slice(-5).reverse().map((location) => (
                <div key={location.tracking_location_id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accuracy: ±{location.accuracy}m
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(location.recorded_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {tracking.locations.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing latest 5 of {tracking.locations.length} updates
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Placeholder */}
      {tracking.locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
            <CardDescription>
              Real-time delivery location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Map integration available when Google Maps API is configured
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Latest location: {tracking.locations[tracking.locations.length - 1].latitude.toFixed(4)}, {tracking.locations[tracking.locations.length - 1].longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

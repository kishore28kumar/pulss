import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin, 
  Phone,
  WhatsappLogo
} from '@phosphor-icons/react'

interface OrderStatus {
  id: string
  orderId: string
  status: 'placed' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered'
  timestamp: string
  message: string
  location?: string
  estimatedDelivery?: string
}

interface Order {
  id: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  address: string
  phone: string
  status: OrderStatus[]
  trackingId?: string
  deliveryPartner?: {
    name: string
    phone: string
    photo?: string
  }
}

interface OrderTrackerProps {
  orderId: string
  customerPhone?: string
  whatsappNumber?: string
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  orderId,
  customerPhone,
  whatsappNumber
}) => {
  const [order, setOrder] = useKV<Order | null>(`order-${orderId}`, null)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null)

  useEffect(() => {
    if (order && order.status.length > 0) {
      setCurrentStatus(order.status[order.status.length - 1])
    }
  }, [order])

  const statusSteps = [
    { key: 'placed', label: 'Order Placed', icon: CheckCircle },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ]

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status)
  }

  const currentIndex = currentStatus ? getStatusIndex(currentStatus.status) : 0
  const progress = ((currentIndex + 1) / statusSteps.length) * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
      case 'confirmed':
        return 'bg-blue-500'
      case 'preparing':
      case 'packed':
        return 'bg-yellow-500'
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-orange-500'
      case 'delivered':
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  const handleCallDelivery = () => {
    if (order?.deliveryPartner?.phone) {
      window.open(`tel:${order.deliveryPartner.phone}`, '_self')
    }
  }

  const handleWhatsAppSupport = () => {
    if (whatsappNumber) {
      const message = encodeURIComponent(`Hi! I need help with my order ${orderId}. Current status: ${currentStatus?.message || 'In progress'}`)
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
    }
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Order #{orderId} not found. Please check your order ID.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order #{orderId}
              </CardTitle>
              <p className="text-muted-foreground">
                {order.items.length} items • ₹{order.total}
              </p>
            </div>
            <Badge 
              className={`${getStatusColor(currentStatus?.status || 'placed')} text-white`}
            >
              {currentStatus?.message || 'Processing'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Order Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Estimated Delivery */}
            {currentStatus?.estimatedDelivery && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">
                    Estimated Delivery: {currentStatus.estimatedDelivery}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentIndex
              const isCurrent = index === currentIndex
              const StatusIcon = step.icon
              
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? getStatusColor(step.key) + ' text-white' 
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'animate-pulse ring-4 ring-blue-200' : ''}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {isCurrent && currentStatus && (
                      <div className="text-sm text-muted-foreground">
                        <p>{currentStatus.message}</p>
                        <p className="text-xs">{new Date(currentStatus.timestamp).toLocaleString()}</p>
                        {currentStatus.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{currentStatus.location}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Partner Info */}
      {order.deliveryPartner && currentStatus?.status === 'out_for_delivery' && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {order.deliveryPartner.photo ? (
                <img 
                  src={order.deliveryPartner.photo} 
                  alt={order.deliveryPartner.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {order.deliveryPartner.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{order.deliveryPartner.name}</p>
                <p className="text-sm text-muted-foreground">Delivery Partner</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCallDelivery}
                className="flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {whatsappNumber && (
              <Button 
                onClick={handleWhatsAppSupport}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <WhatsappLogo className="w-4 h-4 mr-2" />
                WhatsApp Support
              </Button>
            )}
            {customerPhone && (
              <Button 
                variant="outline"
                onClick={() => window.open(`tel:${customerPhone}`, '_self')}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Store
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
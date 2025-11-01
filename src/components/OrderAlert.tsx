import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Bell, X, Package, Clock, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDistance } from 'date-fns'

interface Order {
  order_id: string
  order_number: string
  customer_id: string
  total: number
  acceptance_status: string
  acceptance_deadline: string
  auto_accept_timer: number
  created_at: string
}

interface OrderAlertProps {
  order: Order
  onAccept: (orderId: string) => Promise<void>
  onDismiss: () => void
  tenantId: string
}

export const OrderAlert: React.FC<OrderAlertProps> = ({
  order,
  onAccept,
  onDismiss,
  tenantId
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isAccepting, setIsAccepting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasPlayedSound = useRef(false)

  // Calculate time remaining until auto-accept
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const deadline = new Date(order.acceptance_deadline).getTime()
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000))
      return remaining
    }

    setTimeRemaining(calculateTimeRemaining())

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        // Auto-accept happened on backend
        toast.info('⏰ Order Auto-Accepted', {
          description: 'The order was automatically accepted due to timeout.'
        })
        onDismiss()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [order.acceptance_deadline, onDismiss])

  // Play alert sound when component mounts
  useEffect(() => {
    if (!hasPlayedSound.current) {
      playAlertSound()
      hasPlayedSound.current = true
    }
  }, [])

  const playAlertSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/new-order.mp3')
        audioRef.current.volume = 0.7
      }
      
      audioRef.current.currentTime = 0
      await audioRef.current.play()
    } catch (error) {
      console.warn('Could not play alert sound:', error)
      
      // Browser notification as fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: `Order ${order.order_number} - ₹${order.total}`,
          icon: '/favicon.ico',
          tag: `order-${order.order_id}`
        })
      }
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept(order.order_id)
      toast.success('✅ Order Accepted', {
        description: `Order ${order.order_number} has been accepted.`
      })
      onDismiss()
    } catch (error) {
      toast.error('Failed to accept order', {
        description: 'Please try again.'
      })
      setIsAccepting(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (timeRemaining / order.auto_accept_timer) * 100

  return (
    <Card className="border-l-4 border-l-yellow-500 shadow-lg animate-in slide-in-from-top">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5 text-yellow-600 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>New Order Received</span>
                <Badge variant="outline" className="ml-2">
                  {order.order_number}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDistance(new Date(order.created_at), new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Order Total</p>
              <p className="text-xs text-muted-foreground">Payment pending</p>
            </div>
          </div>
          <p className="text-xl font-bold text-primary">₹{order.total}</p>
        </div>

        {/* Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Auto-accept in:</span>
            </div>
            <span className={`text-lg font-bold ${
              timeRemaining < 60 ? 'text-red-600 animate-pulse' : 'text-primary'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          
          <p className="text-xs text-muted-foreground text-center">
            Order will be automatically accepted if not manually accepted
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isAccepting ? 'Accepting...' : 'Accept Order'}
          </Button>
        </div>

        {timeRemaining < 60 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
            <p className="text-xs text-red-700 font-medium">
              ⚠️ Less than 1 minute remaining!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

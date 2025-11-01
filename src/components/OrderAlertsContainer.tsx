import React, { useState, useEffect } from 'react'
import { OrderAlert } from './OrderAlert'
import { toast } from 'sonner'

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

interface OrderAlertsContainerProps {
  tenantId: string
  apiUrl: string
  authToken: string
}

export const OrderAlertsContainer: React.FC<OrderAlertsContainerProps> = ({
  tenantId,
  apiUrl,
  authToken
}) => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      const response = await fetch(`${apiUrl}/orders/tenants/${tenantId}/pending-acceptance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch pending orders:', error)
    }
  }

  // Accept order
  const handleAcceptOrder = async (orderId: string) => {
    const response = await fetch(`${apiUrl}/orders/${orderId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estimated_delivery_time: null,
        notes: 'Accepted via order alert'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to accept order')
    }

    // Remove from pending orders
    setPendingOrders(prev => prev.filter(o => o.order_id !== orderId))
  }

  // Dismiss alert
  const handleDismissAlert = (orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.order_id !== orderId))
  }

  // Poll for new orders every 10 seconds
  useEffect(() => {
    fetchPendingOrders()

    const interval = setInterval(() => {
      fetchPendingOrders()
    }, 10000)

    setPollingInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [tenantId, apiUrl, authToken])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (pendingOrders.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      {pendingOrders.map(order => (
        <OrderAlert
          key={order.order_id}
          order={order}
          onAccept={handleAcceptOrder}
          onDismiss={() => handleDismissAlert(order.order_id)}
          tenantId={tenantId}
        />
      ))}
    </div>
  )
}

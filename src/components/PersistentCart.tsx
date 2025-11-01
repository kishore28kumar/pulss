import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Plus, Minus, Trash, ArrowClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    selling_price: number
    mrp: number
    image_url: string
    requires_prescription: boolean
  }
}

interface PersistentCartProps {
  apiUrl: string
  authToken: string
  onCheckout?: () => void
}

export const PersistentCart: React.FC<PersistentCartProps> = ({
  apiUrl,
  authToken,
  onCheckout
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Load cart from server
  const loadCart = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/cart`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to load cart')

      const data = await response.json()
      setCartItems(data.data?.items || [])
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  // Sync cart with server (merge guest cart with user cart)
  const syncCart = async () => {
    try {
      setSyncing(true)
      
      // Get guest cart from localStorage
      const guestCart = localStorage.getItem('guestCart')
      if (!guestCart) {
        await loadCart()
        return
      }

      const guestItems = JSON.parse(guestCart)
      
      // Sync with server
      const response = await fetch(`${apiUrl}/cart/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: guestItems })
      })

      if (!response.ok) throw new Error('Failed to sync cart')

      // Clear guest cart
      localStorage.removeItem('guestCart')
      
      // Reload cart
      await loadCart()
      toast.success('Cart synced successfully')
    } catch (error) {
      console.error('Error syncing cart:', error)
      toast.error('Failed to sync cart')
    } finally {
      setSyncing(false)
    }
  }

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch(`${apiUrl}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (!response.ok) throw new Error('Failed to update quantity')

      // Update local state
      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  // Remove item
  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`${apiUrl}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to remove item')

      // Update local state
      setCartItems(items => items.filter(item => item.id !== itemId))
      toast.success('Item removed from cart')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.product.selling_price * item.quantity), 0
  )
  const savings = cartItems.reduce((sum, item) => 
    sum + ((item.product.mrp - item.product.selling_price) * item.quantity), 0
  )

  useEffect(() => {
    if (authToken) {
      syncCart()
    }
  }, [authToken])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading cart...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({cartItems.length} items)
          </CardTitle>
          {syncing && (
            <Badge variant="outline" className="animate-pulse">
              <ArrowClockwise className="w-3 h-3 mr-1 animate-spin" />
              Syncing...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart items */}
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 pb-4 border-b">
                <img
                  src={item.product.image_url || '/placeholder.png'}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold">₹{item.product.selling_price}</span>
                    {item.product.mrp > item.product.selling_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{item.product.mrp}
                      </span>
                    )}
                    {item.product.requires_prescription && (
                      <Badge variant="outline" className="text-xs">Rx Required</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>You save</span>
                  <span>₹{savings.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <Button
              className="w-full"
              size="lg"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

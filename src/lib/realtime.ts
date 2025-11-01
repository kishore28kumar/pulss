/**
 * Real-time service for live updates using Supabase Realtime
 * Handles order updates, inventory changes, and system events
 */

import { supabase } from './supabase'
import { notificationService } from './notifications'
import { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeEventHandler {
  table: string
  filter?: string
  callback: (payload: any) => void
}

interface OrderRealtimeData {
  id: string
  status: string
  total: number
  customer_name: string
  customer_phone: string
  tenant_id: string
  created_at: string
  updated_at: string
}

class RealtimeService {
  private static instance: RealtimeService
  private channels = new Map<string, RealtimeChannel>()
  private handlers = new Map<string, RealtimeEventHandler[]>()
  private isConnected = false

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  /**
   * Initialize realtime connections
   */
  async initialize(tenantId?: string): Promise<void> {
    try {
      // Initialize notification service
      await notificationService.initialize()

      // Set up realtime channels based on user role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      // Set up channels based on role
      if (profile.role === 'super_admin') {
        await this.setupSuperAdminChannels()
      } else if (profile.role === 'admin' || profile.role === 'staff') {
        await this.setupAdminChannels(profile.tenant_id)
      } else {
        await this.setupCustomerChannels(user.id, profile.tenant_id)
      }

      this.isConnected = true
      console.log('Realtime service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize realtime service:', error)
    }
  }

  /**
   * Setup channels for super admin
   */
  private async setupSuperAdminChannels(): Promise<void> {
    // Listen to all tenant creations and updates
    await this.subscribeToTable('tenants', undefined, this.handleTenantUpdate.bind(this))
    
    // Listen to all order statistics
    await this.subscribeToTable('orders', undefined, this.handleGlobalOrderUpdate.bind(this))
  }

  /**
   * Setup channels for admin/staff
   */
  private async setupAdminChannels(tenantId: string): Promise<void> {
    // Listen to new orders for this tenant
    await this.subscribeToTable('orders', `tenant_id=eq.${tenantId}`, this.handleNewOrder.bind(this))
    
    // Listen to order updates
    await this.subscribeToTable('orders', `tenant_id=eq.${tenantId}`, this.handleOrderUpdate.bind(this))
    
    // Listen to inventory changes
    await this.subscribeToTable('inventory', `tenant_id=eq.${tenantId}`, this.handleInventoryUpdate.bind(this))
    
    // Listen to customer registrations
    await this.subscribeToTable('customers', `tenant_id=eq.${tenantId}`, this.handleCustomerUpdate.bind(this))
    
    // Listen to prescription submissions
    await this.subscribeToTable('prescriptions', `tenant_id=eq.${tenantId}`, this.handlePrescriptionUpdate.bind(this))
  }

  /**
   * Setup channels for customers
   */
  private async setupCustomerChannels(userId: string, tenantId?: string): Promise<void> {
    // Listen to order updates for this customer
    await this.subscribeToTable('orders', `customer_id=eq.${userId}`, this.handleCustomerOrderUpdate.bind(this))
    
    // Listen to delivery updates
    await this.subscribeToTable('delivery_events', undefined, this.handleDeliveryUpdate.bind(this))
    
    // Listen to messages for customer support
    await this.subscribeToTable('messages', `customer_id=eq.${userId}`, this.handleMessageUpdate.bind(this))
  }

  /**
   * Subscribe to table changes
   */
  private async subscribeToTable(
    table: string,
    filter?: string,
    callback?: (payload: any) => void
  ): Promise<void> {
    const channelName = filter ? `${table}-${filter}` : table
    
    // Create channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        }, 
        callback || this.defaultHandler.bind(this)
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}:`, status)
      })

    this.channels.set(channelName, channel)
  }

  /**
   * Default event handler
   */
  private defaultHandler(payload: any): void {
    console.log('Realtime event received:', payload)
  }

  /**
   * Handle new order for admins
   */
  private async handleNewOrder(payload: any): Promise<void> {
    if (payload.eventType === 'INSERT') {
      const orderData = payload.new as OrderRealtimeData
      
      console.log('New order received:', orderData)
      
      // Play notification sound and show alert
      await notificationService.notifyNewOrder({
        id: orderData.id,
        total: orderData.total,
        customer_name: orderData.customer_name
      })

      // Dispatch custom event for UI components
      window.dispatchEvent(new CustomEvent('new-order', { 
        detail: orderData 
      }))

      // Update order statistics in real-time
      this.updateOrderStatistics()
    }
  }

  /**
   * Handle order updates
   */
  private async handleOrderUpdate(payload: any): Promise<void> {
    if (payload.eventType === 'UPDATE') {
      const orderData = payload.new as OrderRealtimeData
      const oldData = payload.old as OrderRealtimeData
      
      // Check if status changed
      if (orderData.status !== oldData.status) {
        console.log('Order status updated:', orderData)
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('order-status-update', { 
          detail: { 
            orderId: orderData.id, 
            newStatus: orderData.status,
            oldStatus: oldData.status
          } 
        }))
      }
    }
  }

  /**
   * Handle customer order updates
   */
  private async handleCustomerOrderUpdate(payload: any): Promise<void> {
    if (payload.eventType === 'UPDATE') {
      const orderData = payload.new as OrderRealtimeData
      const oldData = payload.old as OrderRealtimeData
      
      // Notify customer of status changes
      if (orderData.status !== oldData.status) {
        await notificationService.notifyOrderUpdate(orderData, orderData.status)
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('my-order-update', { 
          detail: orderData 
        }))
      }
    }
  }

  /**
   * Handle inventory updates
   */
  private async handleInventoryUpdate(payload: any): Promise<void> {
    if (payload.eventType === 'UPDATE') {
      const inventoryData = payload.new
      
      // Check for low stock
      if (inventoryData.quantity <= inventoryData.low_stock_threshold) {
        // Get product details
        const { data: product } = await supabase
          .from('products')
          .select('name, id')
          .eq('id', inventoryData.product_id)
          .single()

        if (product) {
          await notificationService.notifyLowStock({
            id: product.id,
            name: product.name,
            stock: inventoryData.quantity
          })
        }
      }
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('inventory-update', { 
        detail: inventoryData 
      }))
    }
  }

  /**
   * Handle delivery updates
   */
  private async handleDeliveryUpdate(payload: any): Promise<void> {
    if (payload.eventType === 'INSERT') {
      const deliveryData = payload.new
      
      // Dispatch event for live tracking
      window.dispatchEvent(new CustomEvent('delivery-location-update', { 
        detail: deliveryData 
      }))
    }
  }

  /**
   * Handle prescription updates
   */
  private async handlePrescriptionUpdate(payload: any): Promise<void> {
    if (payload.eventType === 'INSERT') {
      const prescriptionData = payload.new
      
      // Notify admin of new prescription submission
      await notificationService.showNotification({
        title: '📋 New Prescription Submitted',
        body: `Prescription received for Order #${prescriptionData.order_id}`,
        tag: `prescription-${prescriptionData.id}`,
        requireInteraction: true,
        data: {
          type: 'prescription',
          prescriptionId: prescriptionData.id,
          route: '/admin/prescriptions'
        }
      }, 'order-update')
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('prescription-submitted', { 
        detail: prescriptionData 
      }))
    }

    if (payload.eventType === 'UPDATE') {
      const prescriptionData = payload.new
      const oldData = payload.old
      
      // Notify customer of prescription status change
      if (prescriptionData.status !== oldData.status) {
        const statusMessages = {
          'approved': 'Your prescription has been approved',
          'rejected': 'Your prescription needs review'
        }
        
        if (statusMessages[prescriptionData.status as keyof typeof statusMessages]) {
          await notificationService.showNotification({
            title: '📋 Prescription Update',
            body: statusMessages[prescriptionData.status as keyof typeof statusMessages],
            tag: `prescription-update-${prescriptionData.id}`,
            data: {
              type: 'prescription-update',
              prescriptionId: prescriptionData.id
            }
          }, 'order-update')
        }
      }
    }
  }

  /**
   * Handle tenant updates for super admin
   */
  private handleTenantUpdate(payload: any): void {
    if (payload.eventType === 'INSERT') {
      console.log('New tenant created:', payload.new)
      
      // Dispatch event for super admin dashboard
      window.dispatchEvent(new CustomEvent('tenant-created', { 
        detail: payload.new 
      }))
    }
  }

  /**
   * Handle global order updates for super admin
   */
  private handleGlobalOrderUpdate(payload: any): void {
    // Update global statistics
    window.dispatchEvent(new CustomEvent('global-order-update', { 
      detail: payload 
    }))
  }

  /**
   * Handle customer updates
   */
  private handleCustomerUpdate(payload: any): void {
    if (payload.eventType === 'INSERT') {
      console.log('New customer registered:', payload.new)
      
      // Dispatch event for admin dashboard
      window.dispatchEvent(new CustomEvent('customer-registered', { 
        detail: payload.new 
      }))
    }
  }

  /**
   * Handle message updates
   */
  private handleMessageUpdate(payload: any): void {
    if (payload.eventType === 'INSERT') {
      const messageData = payload.new
      
      // Show notification for new messages
      notificationService.showNotification({
        title: '💬 New Message',
        body: messageData.content.substring(0, 50) + '...',
        tag: `message-${messageData.id}`,
        data: {
          type: 'message',
          messageId: messageData.id,
          orderId: messageData.order_id
        }
      }, 'order-update')
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('new-message', { 
        detail: messageData 
      }))
    }
  }

  /**
   * Update order statistics in real-time
   */
  private async updateOrderStatistics(): Promise<void> {
    try {
      // This would fetch updated statistics and dispatch events
      window.dispatchEvent(new CustomEvent('update-order-statistics'))
    } catch (error) {
      console.error('Failed to update order statistics:', error)
    }
  }

  /**
   * Send real-time message
   */
  async sendRealtimeMessage(channel: string, event: string, payload: any): Promise<void> {
    const channelInstance = this.channels.get(channel)
    if (channelInstance) {
      await channelInstance.send({
        type: 'broadcast',
        event,
        payload
      })
    }
  }

  /**
   * Subscribe to custom events
   */
  subscribeToCustomEvent(eventName: string, callback: (detail: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail)
    window.addEventListener(eventName as any, handler)
    
    // Return unsubscribe function
    return () => window.removeEventListener(eventName as any, handler)
  }

  /**
   * Disconnect all channels
   */
  async disconnect(): Promise<void> {
    try {
      for (const [name, channel] of this.channels) {
        await supabase.removeChannel(channel)
        console.log(`Disconnected from channel: ${name}`)
      }
      
      this.channels.clear()
      this.isConnected = false
      
      console.log('Realtime service disconnected')
    } catch (error) {
      console.error('Error disconnecting realtime service:', error)
    }
  }

  /**
   * Check connection status
   */
  isConnectedToRealtime(): boolean {
    return this.isConnected
  }

  /**
   * Reconnect to realtime
   */
  async reconnect(): Promise<void> {
    await this.disconnect()
    await this.initialize()
  }
}

export const realtimeService = RealtimeService.getInstance()
export type { OrderRealtimeData, RealtimeEventHandler }
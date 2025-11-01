/**
 * Real-time notification service with audio alerts and ringtones
 * Handles order notifications, system alerts, and custom audio notifications
 */

/// <reference path="../types/spark.d.ts" />

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  sound?: string
  data?: any
}

interface RingtoneOptions {
  volume: number
  duration: number
  repeat: boolean
  fadeIn: boolean
  fadeOut: boolean
}

class NotificationService {
  private static instance: NotificationService
  private audioContext: AudioContext | null = null
  private ringtones = new Map<string, HTMLAudioElement>()
  private isEnabled = false
  private currentRingtone: HTMLAudioElement | null = null

  // Default ringtones
  private readonly DEFAULT_RINGTONES = {
    'new-order': '/sounds/new-order.mp3',
    'order-update': '/sounds/notification.mp3',
    'urgent': '/sounds/urgent.mp3',
    'success': '/sounds/success.mp3',
    'error': '/sounds/error.mp3'
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        this.isEnabled = permission === 'granted'
      }

      // Initialize audio context
      this.initializeAudio()

      // Load default ringtones
      await this.loadDefaultRingtones()

      // Initialize service worker for background notifications
      await this.initializeServiceWorker()

      console.log('Notification service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
    }
  }

  /**
   * Initialize audio context and load ringtones
   */
  private initializeAudio(): void {
    try {
      // Create audio context for advanced audio features
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not supported:', error)
    }
  }

  /**
   * Load default ringtones
   */
  private async loadDefaultRingtones(): Promise<void> {
    const loadPromises = Object.entries(this.DEFAULT_RINGTONES).map(async ([key, url]) => {
      try {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.volume = 0.7
        
        return new Promise<void>((resolve, reject) => {
          audio.oncanplaythrough = () => {
            this.ringtones.set(key, audio)
            resolve()
          }
          audio.onerror = reject
          audio.src = url
        })
      } catch (error) {
        console.warn(`Failed to load ringtone ${key}:`, error)
        // Create a silent audio element as fallback
        const audio = new Audio()
        this.ringtones.set(key, audio)
      }
    })

    try {
      await Promise.allSettled(loadPromises)
    } catch (error) {
      console.warn('Some ringtones failed to load:', error)
    }
  }

  /**
   * Initialize service worker for background notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        console.log('Service worker ready for notifications')
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'notification-click') {
            this.handleNotificationClick(event.data.notification)
          }
        })
      } catch (error) {
        console.error('Service worker initialization failed:', error)
      }
    }
  }

  /**
   * Show notification with optional ringtone
   */
  async showNotification(
    options: NotificationOptions,
    ringtone?: string,
    ringtoneOptions?: Partial<RingtoneOptions>
  ): Promise<void> {
    try {
      // Play ringtone if specified
      if (ringtone) {
        await this.playRingtone(ringtone, ringtoneOptions)
      }

      // Show browser notification
      if (this.isEnabled && 'Notification' in window) {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/icon-192x192.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          data: options.data
        })

        // Handle notification click
        notification.onclick = () => {
          this.handleNotificationClick({ ...options, id: options.tag || Date.now().toString() })
          notification.close()
        }

        // Auto-close after 10 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close()
          }, 10000)
        }
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  /**
   * Play ringtone with options
   */
  async playRingtone(
    ringtoneKey: string,
    options: Partial<RingtoneOptions> = {}
  ): Promise<void> {
    try {
      const audio = this.ringtones.get(ringtoneKey)
      if (!audio) {
        console.warn(`Ringtone ${ringtoneKey} not found`)
        return
      }

      // Stop current ringtone if playing
      this.stopCurrentRingtone()

      // Apply options
      const config: RingtoneOptions = {
        volume: options.volume ?? 0.7,
        duration: options.duration ?? 0, // 0 means play full audio
        repeat: options.repeat ?? false,
        fadeIn: options.fadeIn ?? false,
        fadeOut: options.fadeOut ?? false
      }

      // Set volume
      audio.volume = config.volume

      // Handle looping
      audio.loop = config.repeat

      // Fade in effect
      if (config.fadeIn) {
        audio.volume = 0
        this.fadeAudio(audio, 0, config.volume, 1000)
      }

      // Play audio
      await audio.play()
      this.currentRingtone = audio

      // Handle duration limit
      if (config.duration > 0) {
        setTimeout(() => {
          if (config.fadeOut) {
            this.fadeAudio(audio, audio.volume, 0, 500).then(() => {
              audio.pause()
              audio.currentTime = 0
            })
          } else {
            audio.pause()
            audio.currentTime = 0
          }
          this.currentRingtone = null
        }, config.duration)
      }

      // Handle end event for non-looping audio
      if (!config.repeat) {
        audio.onended = () => {
          this.currentRingtone = null
        }
      }

    } catch (error) {
      console.error('Failed to play ringtone:', error)
    }
  }

  /**
   * Stop currently playing ringtone
   */
  stopCurrentRingtone(): void {
    if (this.currentRingtone) {
      this.currentRingtone.pause()
      this.currentRingtone.currentTime = 0
      this.currentRingtone = null
    }
  }

  /**
   * Fade audio volume
   */
  private fadeAudio(audio: HTMLAudioElement, startVolume: number, endVolume: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = 20
      const stepDuration = duration / steps
      const volumeStep = (endVolume - startVolume) / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        audio.volume = Math.max(0, Math.min(1, startVolume + (volumeStep * currentStep)))

        if (currentStep >= steps) {
          clearInterval(interval)
          resolve()
        }
      }, stepDuration)
    })
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: any): void {
    // Focus the window
    if (window.parent) {
      window.parent.focus()
    }
    window.focus()

    // Route to appropriate page based on notification type
    if (notification.data?.route) {
      window.location.hash = notification.data.route
    }

    // Custom handlers based on notification type
    if (notification.data?.type === 'new-order') {
      this.handleNewOrderClick(notification.data)
    }
  }

  /**
   * Handle new order notification click
   */
  private handleNewOrderClick(data: any): void {
    // Stop ringtone
    this.stopCurrentRingtone()
    
    // Navigate to orders page
    window.location.hash = '/admin/orders'
    
    // Dispatch custom event for components to handle
    window.dispatchEvent(new CustomEvent('order-notification-click', { detail: data }))
  }

  /**
   * Send new order notification (for admins)
   */
  async notifyNewOrder(orderData: any): Promise<void> {
    const notification: NotificationOptions = {
      title: '🔔 New Order Received!',
      body: `Order #${orderData.id} - ₹${orderData.total} from ${orderData.customer_name}`,
      icon: '/icon-192x192.png',
      tag: `order-${orderData.id}`,
      requireInteraction: true,
      data: {
        type: 'new-order',
        orderId: orderData.id,
        route: '/admin/orders'
      }
    }

    await this.showNotification(notification, 'new-order', {
      volume: 0.8,
      repeat: true,
      duration: 15000, // 15 seconds
      fadeOut: true
    })
  }

  /**
   * Send order status update notification (for customers)
   */
  async notifyOrderUpdate(orderData: any, status: string): Promise<void> {
    const statusMessages = {
      'confirmed': 'Order confirmed by the store',
      'packed': 'Order is being packed',
      'shipped': 'Order shipped and on the way',
      'out_for_delivery': 'Order is out for delivery',
      'delivered': 'Order has been delivered'
    }

    const notification: NotificationOptions = {
      title: `Order #${orderData.id} Update`,
      body: statusMessages[status as keyof typeof statusMessages] || `Status changed to ${status}`,
      icon: '/icon-192x192.png',
      tag: `order-update-${orderData.id}`,
      data: {
        type: 'order-update',
        orderId: orderData.id,
        status,
        route: `/orders/${orderData.id}`
      }
    }

    await this.showNotification(notification, 'order-update')
  }

  /**
   * Send low stock alert (for admins)
   */
  async notifyLowStock(productData: any): Promise<void> {
    const notification: NotificationOptions = {
      title: '⚠️ Low Stock Alert',
      body: `${productData.name} is running low (${productData.stock} remaining)`,
      icon: '/icon-192x192.png',
      tag: `low-stock-${productData.id}`,
      data: {
        type: 'low-stock',
        productId: productData.id,
        route: '/admin/inventory'
      }
    }

    await this.showNotification(notification, 'urgent', {
      volume: 0.6,
      repeat: false
    })
  }

  /**
   * Add custom ringtone
   */
  async addCustomRingtone(key: string, audioFile: File): Promise<void> {
    try {
      const url = URL.createObjectURL(audioFile)
      const audio = new Audio(url)
      
      return new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => {
          this.ringtones.set(key, audio)
          resolve()
        }
        audio.onerror = reject
        audio.load()
      })
    } catch (error) {
      console.error('Failed to add custom ringtone:', error)
      throw error
    }
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied'
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Test notification system
   */
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: 'Test Notification',
      body: 'Pulss notification system is working correctly!',
      icon: '/icon-192x192.png',
      tag: 'test-notification'
    }, 'success')
  }
}

export const notificationService = NotificationService.getInstance()
export type { NotificationOptions, RingtoneOptions }
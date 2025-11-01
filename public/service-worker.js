// Service Worker for Pulss Platform
// Provides offline support, caching, and performance optimization

const CACHE_NAME = 'pulss-v1'
const STATIC_CACHE = 'pulss-static-v1'
const IMAGE_CACHE = 'pulss-images-v1'
const API_CACHE = 'pulss-api-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('pulss-') && name !== CACHE_NAME && name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE)
            .map(name => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone()
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || new Response(JSON.stringify({
              success: false,
              message: 'You are offline. Please check your connection.'
            }), {
              headers: { 'Content-Type': 'application/json' }
            }))
        })
    )
    return
  }

  // Images - cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached
          
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(IMAGE_CACHE).then(cache => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
        })
    )
    return
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
      .catch(() => {
        // If offline and not cached, show offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pulss', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Helper functions
async function syncCart() {
  try {
    const cartData = await getStoredCart()
    if (!cartData) return

    const response = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify(cartData)
    })

    if (response.ok) {
      await clearStoredCart()
    }
  } catch (error) {
    console.error('Error syncing cart:', error)
  }
}

async function syncOrders() {
  try {
    const pendingOrders = await getPendingOrders()
    if (!pendingOrders || pendingOrders.length === 0) return

    for (const order of pendingOrders) {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(order)
      })

      if (response.ok) {
        await removePendingOrder(order.id)
      }
    }
  } catch (error) {
    console.error('Error syncing orders:', error)
  }
}

async function getStoredCart() {
  // Implementation would use IndexedDB
  return null
}

async function clearStoredCart() {
  // Implementation would use IndexedDB
}

async function getPendingOrders() {
  // Implementation would use IndexedDB
  return []
}

async function removePendingOrder(orderId) {
  // Implementation would use IndexedDB
}

async function getAuthToken() {
  // Get token from IndexedDB or sessionStorage
  return ''
}

/**
 * Utility to manage dynamic PWA manifest based on tenant
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Get the current tenant ID from the URL
 * Supports both subdomain and path-based routing
 */
export const getCurrentTenantId = (): string | null => {
  const host = window.location.host
  const pathname = window.location.pathname
  
  // Check for subdomain-based tenant (e.g., tenant1.pulss.com)
  const subdomain = host.split('.')[0]
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'www' && !host.includes('localhost')) {
    return subdomain
  }
  
  // Check for path-based tenant (e.g., /store/tenant-id)
  const pathMatch = pathname.match(/^\/store\/([^/]+)/)
  if (pathMatch) {
    return pathMatch[1]
  }
  
  // Check localStorage for selected tenant (for development/testing)
  return localStorage.getItem('selected_tenant_id')
}

/**
 * Update the manifest link in the HTML head to point to tenant-specific manifest
 */
export const updateManifestForTenant = (tenantId: string | null) => {
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
  
  if (!manifestLink) {
    console.warn('Manifest link not found in document head')
    return
  }
  
  if (tenantId) {
    // Use tenant-specific manifest
    manifestLink.href = `${API_URL}/api/tenants/${tenantId}/manifest.json`
  } else {
    // Use default manifest
    manifestLink.href = '/manifest.json'
  }
}

/**
 * Fetch and apply tenant-specific branding
 */
export const applyTenantBranding = async (tenantId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/tenants/${tenantId}/settings`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenant settings')
    }
    
    const { settings } = await response.json()
    
    // Update favicon if available
    if (settings.favicon_url) {
      updateFavicon(settings.favicon_url)
    } else if (settings.logo_url) {
      // Fallback to logo if no favicon
      updateFavicon(settings.logo_url)
    }
    
    // Update theme color
    if (settings.primary_color) {
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', settings.primary_color)
      }
    }
    
    // Update page title
    if (settings.shop_name || settings.name) {
      document.title = settings.shop_name || settings.name
    }
    
    return settings
  } catch (error) {
    console.error('Failed to apply tenant branding:', error)
    return null
  }
}

/**
 * Update the favicon in the HTML head
 */
export const updateFavicon = (faviconUrl: string) => {
  // Remove existing favicons
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
  existingFavicons.forEach(favicon => favicon.remove())
  
  // Add new favicon
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.href = faviconUrl.startsWith('http') ? faviconUrl : `${API_URL}${faviconUrl}`
  document.head.appendChild(link)
  
  // Add apple-touch-icon
  const appleLink = document.createElement('link')
  appleLink.rel = 'apple-touch-icon'
  appleLink.href = faviconUrl.startsWith('http') ? faviconUrl : `${API_URL}${faviconUrl}`
  document.head.appendChild(appleLink)
}

/**
 * Initialize tenant-specific PWA configuration
 * Call this on app startup
 */
export const initializeTenantPWA = async () => {
  const tenantId = getCurrentTenantId()
  
  if (tenantId) {
    // Update manifest link
    updateManifestForTenant(tenantId)
    
    // Apply tenant branding
    await applyTenantBranding(tenantId)
  }
}

/**
 * Check if the app is running as a PWA
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://')
}

/**
 * Trigger PWA install prompt if available
 */
export const promptPWAInstall = () => {
  const deferredPrompt = (window as any).deferredPromptEvent
  
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt')
      } else {
        console.log('User dismissed the PWA install prompt')
      }
      (window as any).deferredPromptEvent = null
    })
  } else {
    console.log('PWA install prompt not available')
  }
}

// Listen for beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    ;(window as any).deferredPromptEvent = e
    console.log('PWA install prompt is ready')
  })
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
    ;(window as any).deferredPromptEvent = null
  })
}

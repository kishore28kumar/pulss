/**
 * Environment-based URL Configuration for Admin Dashboard
 * 
 * Uses DEPLOY_ENV environment variable to determine which API URL to use:
 * - 'development' or 'dev': Development environment URLs
 * - 'production' or 'prod': Production environment URLs
 * - Default: Local development URLs
 */

type DeployEnvironment = 'development' | 'production' | 'dev' | 'prod';

const DEPLOY_ENV = (process.env.DEPLOY_ENV || process.env.NODE_ENV || 'development').toLowerCase() as DeployEnvironment;

// URL Configuration Map
const URL_CONFIG = {
  development: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pulss-dev.onrender.com/api',
    STOREFRONT_URL: process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://pulss-store-dev.onrender.com',
  },
  production: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pulss.onrender.com/api',
    STOREFRONT_URL: process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://pulss-store.onrender.com',
  },
};

// Determine which environment config to use
const getEnvironment = (): 'development' | 'production' => {
  if (DEPLOY_ENV === 'dev' || DEPLOY_ENV === 'development') {
    return 'development';
  }
  if (DEPLOY_ENV === 'prod' || DEPLOY_ENV === 'production') {
    return 'production';
  }
  // Default to development for local dev
  return 'development';
};

const env = getEnvironment();

// Export API URL based on environment
export const getApiUrl = (): string => {
  // Check for runtime override (useful for debugging)
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    console.log('[API Config] Using runtime override:', (window as any).__API_URL__);
    return (window as any).__API_URL__;
  }
  
  // NEXT_PUBLIC_API_URL has highest priority - use it if set
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl) {
    let apiUrl = envApiUrl.trim();
    
    // Handle case where Render's fromService returns just hostname (without protocol)
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }
    
    // Ensure /api is appended if not present (Render fromService only gives hostname)
    if (!apiUrl.endsWith('/api')) {
      apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
    }
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[API Config] NEXT_PUBLIC_API_URL found:', apiUrl);
      console.log('[API Config] Raw process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    }
    
    return apiUrl;
  }
  
  // Otherwise fall back to environment-based config
  const apiUrl = URL_CONFIG[env].API_URL;
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.warn('[API Config] NEXT_PUBLIC_API_URL not set!');
    console.log('[API Config] DEPLOY_ENV:', env);
    console.log('[API Config] NODE_ENV:', process.env.NODE_ENV);
    console.log('[API Config] Using fallback:', apiUrl);
    console.log('[API Config] All NEXT_PUBLIC_ vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
  }
  
  return apiUrl;
};

/**
 * Get Storefront URL with smart fallback logic
 * 
 * Priority:
 * 1. NEXT_PUBLIC_STOREFRONT_URL environment variable
 * 2. Convert Render admin URL to storefront URL (pulss-admin-dev -> pulss-store-dev)
 * 3. Environment-based config fallback
 * 4. Local development fallback (localhost:3000)
 */
export const getStorefrontUrl = (): string => {
  // Check for runtime override (useful for debugging)
  if (typeof window !== 'undefined' && (window as any).__STOREFRONT_URL__) {
    console.log('[Storefront Config] Using runtime override:', (window as any).__STOREFRONT_URL__);
    return (window as any).__STOREFRONT_URL__;
  }
  
  // NEXT_PUBLIC_STOREFRONT_URL has highest priority - use it if set
  const envStorefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  if (envStorefrontUrl) {
    let storefrontUrl = envStorefrontUrl.trim();
    
    // Handle case where Render's fromService returns just hostname (without protocol)
    if (!storefrontUrl.startsWith('http://') && !storefrontUrl.startsWith('https://')) {
      storefrontUrl = `https://${storefrontUrl}`;
    }
    
    // Remove trailing slash
    storefrontUrl = storefrontUrl.replace(/\/$/, '');
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('[Storefront Config] NEXT_PUBLIC_STOREFRONT_URL found:', storefrontUrl);
    }
    
    return storefrontUrl;
  }
  
  // Smart fallback: Convert Render admin URL to storefront URL
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    
    // Check if we're on a Render admin URL and convert to storefront URL
    // Pattern: pulss-admin-dev.onrender.com -> pulss-store-dev.onrender.com
    // Pattern: pulss-admin.onrender.com -> pulss-store.onrender.com
    if (currentOrigin.includes('pulss-admin')) {
      const storefrontUrl = currentOrigin.replace('pulss-admin', 'pulss-store');
      console.log('[Storefront Config] Converted admin URL to storefront:', storefrontUrl);
      return storefrontUrl;
    }
    
    // Check for other Render admin patterns (admin-* -> store-*)
    const adminPattern = /(https?:\/\/[^/]+-admin[^/]*)/i;
    const match = currentOrigin.match(adminPattern);
    if (match) {
      const storefrontUrl = currentOrigin.replace(/-admin/i, '-store');
      console.log('[Storefront Config] Converted admin URL pattern to storefront:', storefrontUrl);
      return storefrontUrl;
    }
    
    // Local development fallback: replace port 3001 with 3000
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      const storefrontUrl = currentOrigin.replace(':3001', ':3000');
      console.log('[Storefront Config] Using local development fallback:', storefrontUrl);
      return storefrontUrl;
    }
  }
  
  // Fall back to environment-based config
  const storefrontUrl = URL_CONFIG[env].STOREFRONT_URL;
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.warn('[Storefront Config] NEXT_PUBLIC_STOREFRONT_URL not set!');
    console.log('[Storefront Config] DEPLOY_ENV:', env);
    console.log('[Storefront Config] Using fallback:', storefrontUrl);
  }
  
  return storefrontUrl;
};

export const config = {
  API_URL: getApiUrl(),
  STOREFRONT_URL: getStorefrontUrl(),
  DEPLOY_ENV: env,
};

export default config;


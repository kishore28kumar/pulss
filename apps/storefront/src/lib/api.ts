import axios from 'axios';
import { getApiUrl } from './config/urls';

const API_URL = getApiUrl();

// Debug logging to verify API URL
if (typeof window !== 'undefined') {
  console.log('[Storefront API] API_URL:', API_URL);
  console.log('[Storefront API] NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

// Helper function to get tenant slug from URL path
const getTenantSlugFromPath = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Extract tenant slug from URL path
  // Path format: /[store-name]/... or /[store-name]
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  return pathSegments[0] || null;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('customerToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Extract tenant slug from URL path and add to headers
      const tenantSlug = getTenantSlugFromPath();
      if (tenantSlug) {
        config.headers['X-Tenant-Slug'] = tenantSlug;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only access localStorage and window on client side
      if (typeof window !== 'undefined') {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('customer');
        
        // Check if we have tenant context from the request
        const tenantSlug = error.config?.headers?.['X-Tenant-Slug'] || getTenantSlugFromPath();
        
        if (tenantSlug) {
          // Redirect to tenant-specific login
          window.location.href = `/${tenantSlug}/login`;
        } else {
          // No tenant context, redirect to home (QR message)
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;


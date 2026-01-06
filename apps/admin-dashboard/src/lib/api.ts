import axios from 'axios';
import { getApiUrl } from './config/urls';

// Get API URL - this is evaluated at module load time
// For runtime changes, you'll need to rebuild the app
let API_URL = getApiUrl();

// Log the API URL being used (for debugging)
if (typeof window !== 'undefined') {
  console.log('[API] Initial API URL:', API_URL);
}

// Helper function to get tenant slug from stored user data
const getTenantSlug = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    // Get tenant slug from user object (user.tenant?.slug)
    return user?.tenant?.slug || null;
  } catch {
    return null;
  }
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant slug
api.interceptors.request.use(
  (config) => {
    // Circuit breaker - reject all requests if circuit is open
    if (isCircuitOpen) {
      return Promise.reject(new Error('Circuit breaker open - too many authentication failures'));
    }
    
    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {} as any;
    }
    
    // Always get token from localStorage and set Authorization header
    // This ensures we always use the freshest token, especially after refresh
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Remove any existing authorization headers first (case-insensitive)
      // Axios normalizes headers, so check all variations
      if (config.headers) {
        const headerKeys = Object.keys(config.headers);
        headerKeys.forEach(key => {
          if (key.toLowerCase() === 'authorization') {
            delete config.headers[key];
          }
        });
      }
      
      // Set fresh token
      config.headers.Authorization = `Bearer ${token}`;
      
      console.log('[API] Setting Authorization header', {
        url: config.url,
        method: config.method,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20),
        headerSet: !!config.headers.Authorization,
      });
    } else {
      console.warn('[API] No token in localStorage', {
        url: config.url,
        method: config.method,
      });
    }

    // Add tenant slug from logged-in user's data
    // For ADMIN/STAFF: Use their tenant slug
    // For SUPER_ADMIN: Can optionally specify tenant, otherwise backend handles it
    const tenantSlug = getTenantSlug();
    if (tenantSlug) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
    } else {
      // Fallback to environment variable if user data not available (e.g., during login)
      const fallbackTenant = process.env.NEXT_PUBLIC_TENANT_SLUG || 'default';
      config.headers['X-Tenant-Slug'] = fallbackTenant;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing the token to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
// Circuit breaker - if too many auth failures, stop all API calls
let isCircuitOpen = false;
let authFailureCount = 0;
const MAX_AUTH_FAILURES = 5;

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    // Reset failure count on successful response
    if (authFailureCount > 0) {
      authFailureCount = 0;
      isCircuitOpen = false;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip interceptor logic for login/auth endpoints to prevent redirect loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                          originalRequest?.url?.includes('/auth/refresh') ||
                          originalRequest?.url?.includes('/auth/customer/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // If we're already refreshing, wait for it to complete
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            // Update the original request headers with the fresh token
            if (!originalRequest.headers) {
              originalRequest.headers = {} as any;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // Retry the request using api.request to ensure interceptors are used
            resolve(api.request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in localStorage FIRST - ensure it's saved synchronously
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Verify token was saved
        const savedToken = localStorage.getItem('accessToken');
        if (savedToken !== accessToken) {
          console.error('[API] Token save verification failed!');
        }

        // Notify all waiting requests
        isRefreshing = false;
        onTokenRefreshed(accessToken);

        // IMPORTANT: Update localStorage FIRST
        // Then create retry config with Authorization header set DIRECTLY
        // This ensures the token is definitely sent, even if interceptor has issues
        
        // Build clean headers object
        const retryHeaders: any = {};
        
        // Copy non-authorization headers from original request
        if (originalRequest.headers) {
          Object.keys(originalRequest.headers).forEach(key => {
            if (key.toLowerCase() !== 'authorization') {
              retryHeaders[key] = originalRequest.headers[key];
            }
          });
        }
        
        // CRITICAL: Set Authorization header directly with fresh token
        retryHeaders.Authorization = `Bearer ${accessToken}`;
        
        const retryConfig: any = {
          method: originalRequest.method,
          url: originalRequest.url,
          baseURL: originalRequest.baseURL || API_URL,
          headers: retryHeaders,
          params: originalRequest.params,
          data: originalRequest.data,
          _retry: true, // Mark as retry to prevent infinite loops
        };
        
        console.log('[API] Retrying request with refreshed token', {
          url: retryConfig.url,
          method: retryConfig.method,
          hasAuthHeader: !!retryConfig.headers.Authorization,
          authHeaderPrefix: retryConfig.headers.Authorization?.substring(0, 30),
          tokenInStorage: !!localStorage.getItem('accessToken'),
        });
        
        // Retry using the api instance - interceptor will also set it, but we have it set directly too
        return api.request(retryConfig);
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    
    // If we already retried and still got 401, don't retry again - open circuit breaker
    if (error.response?.status === 401 && originalRequest._retry && !isAuthEndpoint) {
      authFailureCount++;
      console.error(`Token refresh succeeded but request still failed (${authFailureCount}/${MAX_AUTH_FAILURES})`);
      
      if (authFailureCount >= MAX_AUTH_FAILURES) {
        console.error('Opening circuit breaker - too many authentication failures');
        isCircuitOpen = true;
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(new Error('Authentication failed after token refresh'));
    }
    
    // Track auth failures even for first attempt (before retry)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      authFailureCount++;
      console.warn(`[API] Auth failure count: ${authFailureCount}/${MAX_AUTH_FAILURES}`);
      if (authFailureCount >= MAX_AUTH_FAILURES) {
        isCircuitOpen = true;
        console.error('[API] Opening circuit breaker - too many authentication failures');
        // Immediately stop and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;


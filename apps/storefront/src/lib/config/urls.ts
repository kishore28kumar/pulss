/**
 * Environment-based URL Configuration for Storefront
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
  },
  production: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pulss.onrender.com/api',
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
  let apiUrl: string;
  
  // If NEXT_PUBLIC_API_URL is explicitly set, use it (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    apiUrl = process.env.NEXT_PUBLIC_API_URL;
  } else {
    // Otherwise use environment-based config
    apiUrl = URL_CONFIG[env].API_URL;
  }
  
  // Ensure /api is appended if not present (Render fromService only gives hostname)
  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.endsWith('/') ? `${apiUrl}api` : `${apiUrl}/api`;
  }
  
  return apiUrl;
};

export const config = {
  API_URL: getApiUrl(),
  DEPLOY_ENV: env,
};

export default config;


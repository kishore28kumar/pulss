/**
 * Environment-based URL Configuration
 * 
 * Uses DEPLOY_ENV environment variable to determine which URLs to use:
 * - 'development' or 'dev': Development environment URLs
 * - 'production' or 'prod': Production environment URLs
 * - Default: Local development URLs
 */

type DeployEnvironment = 'development' | 'production' | 'dev' | 'prod';

// Determine deploy environment - prioritize DEPLOY_ENV, then check if URL contains 'dev' or 'prod'
const getDeployEnvFromUrl = (): string | null => {
  const apiUrl = process.env.API_URL || '';
  if (apiUrl.includes('-dev.') || apiUrl.includes('.dev')) {
    return 'development';
  }
  if (apiUrl.includes('-prod.') || apiUrl.includes('.prod') || (!apiUrl.includes('-dev.') && apiUrl.includes('onrender.com'))) {
    return 'production';
  }
  return null;
};

const DEPLOY_ENV = (
  process.env.DEPLOY_ENV || 
  getDeployEnvFromUrl() ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'development')
).toLowerCase() as DeployEnvironment;

// URL Configuration Map
const URL_CONFIG = {
  development: {
    API_URL: process.env.API_URL || 'https://pulss-dev.onrender.com',
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://pulss-store-dev.onrender.com',
    ADMIN_URL: process.env.ADMIN_URL || 'https://pulss-admin-dev.onrender.com',
  },
  production: {
    API_URL: process.env.API_URL || 'https://pulss.onrender.com',
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://pulss-storefront.onrender.com',
    ADMIN_URL: process.env.ADMIN_URL || 'https://pulss-admin.onrender.com',
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

// Export URLs based on environment
export const config = {
  API_URL: URL_CONFIG[env].API_URL,
  FRONTEND_URL: URL_CONFIG[env].FRONTEND_URL,
  ADMIN_URL: URL_CONFIG[env].ADMIN_URL,
  DEPLOY_ENV: env,
};

// For local development fallback
const LOCAL_URLS = {
  API_URL: 'http://localhost:5000',
  FRONTEND_URL: 'http://localhost:3000',
  ADMIN_URL: 'http://localhost:3001',
};

// Get CORS origins - use environment URLs or fallback to local
export const getCorsOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Add admin URL - prioritize environment variable, then config
  const adminUrl = process.env.ADMIN_URL || config.ADMIN_URL;
  if (adminUrl) {
    origins.push(adminUrl);
  }
  
  // Add frontend/storefront URL - prioritize environment variable, then config
  const frontendUrl = process.env.FRONTEND_URL || process.env.STOREFRONT_URL || config.FRONTEND_URL;
  if (frontendUrl) {
    origins.push(frontendUrl);
  }
  
  // Always include localhost for local development
  if (process.env.NODE_ENV !== 'production') {
    origins.push(LOCAL_URLS.ADMIN_URL, LOCAL_URLS.FRONTEND_URL);
    // Also add localhost with any port for development flexibility
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000');
  }
  
  // Remove duplicates and filter out empty strings
  const uniqueOrigins = [...new Set(origins.filter(Boolean))];
  
  // Always log allowed origins at startup for debugging
  console.log('[CORS] Allowed origins:', uniqueOrigins);
  console.log('[CORS] Environment configuration:', {
    DEPLOY_ENV: process.env.DEPLOY_ENV,
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_URL_ENV: process.env.ADMIN_URL,
    ADMIN_URL_CONFIG: config.ADMIN_URL,
    FRONTEND_URL_ENV: process.env.FRONTEND_URL,
    FRONTEND_URL_CONFIG: config.FRONTEND_URL,
    STOREFRONT_URL_ENV: process.env.STOREFRONT_URL,
  });
  
  return uniqueOrigins;
};

export default config;


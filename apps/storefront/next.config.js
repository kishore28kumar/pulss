/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pulss/types'],
  images: {
    unoptimized: true,
  },
  env: {
    // NEXT_PUBLIC_API_URL will be set via environment variables in Render
    // Falls back to environment-based defaults in config/urls.ts
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    DEPLOY_ENV: process.env.DEPLOY_ENV || process.env.NODE_ENV || 'development',
  },
};

module.exports = nextConfig;


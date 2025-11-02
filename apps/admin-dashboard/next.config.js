/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pulss/types'],
  optimizeFonts: false, // Disable font optimization to avoid SSL certificate issues
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
};

module.exports = nextConfig;


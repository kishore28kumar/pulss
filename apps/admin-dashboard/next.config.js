/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pulss/types'],
  optimizeFonts: false, // Disable font optimization to avoid SSL certificate issues
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pulss.onrender.com/api',
  },
};

module.exports = nextConfig;


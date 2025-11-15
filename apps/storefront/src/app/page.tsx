'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Shield, Truck, Store, LogIn, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, customer } = useAuth();
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { isFeatured: true, limit: 8 },
      });
      return response.data.data.data;
    },
    enabled: isAuthenticated && typeof window !== 'undefined',
    retry: false,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl w-full mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-lg mb-6 shadow-sm">
              <Store className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Pulss Store
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover quality products for your everyday needs. Sign in to start shopping with confidence!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {/* Sign In Card */}
            <Link
              href="/login"
              className="group bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-blue-500"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-md mb-6 group-hover:bg-blue-600 transition-colors">
                <LogIn className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign In</h2>
              <p className="text-gray-600 mb-6">
                Already have an account? Sign in to continue shopping and access your orders.
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                <span>Sign In Now</span>
                <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </Link>

            {/* Create Account Card */}
            <Link
              href="/login"
              className="group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-200 text-white"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-md mb-6 group-hover:bg-white/30 transition-colors">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Create Account</h2>
              <p className="text-blue-100 mb-6">
                New to Pulss Store? Create an account to start shopping and enjoy exclusive benefits.
              </p>
              <div className="flex items-center font-semibold group-hover:text-blue-50">
                <span>Get Started</span>
                <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 md:mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-md mb-3">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Free Shipping</h3>
              <p className="text-xs text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-md mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Secure Payment</h3>
              <p className="text-xs text-gray-600">100% secure</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-md mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Quality Products</h3>
              <p className="text-xs text-gray-600">Curated selection</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-md mb-3">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Easy Returns</h3>
              <p className="text-xs text-gray-600">30-day policy</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 md:mb-6">
              Welcome back, {customer?.firstName}!
            </h1>
            <p className="text-lg md:text-xl mb-6 md:mb-8 text-blue-100">
              Discover quality products for your everyday needs. Shop with confidence!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="px-6 md:px-8 py-3 bg-white text-blue-600 rounded-md font-semibold hover:bg-gray-100 transition shadow-sm"
              >
                Shop Now
              </Link>
              <Link
                href="/categories"
                className="px-6 md:px-8 py-3 border-2 border-white text-white rounded-md font-semibold hover:bg-white hover:text-blue-600 transition"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-md mb-3 md:mb-4">
                <Truck className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Free Shipping</h3>
              <p className="text-xs md:text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-md mb-3 md:mb-4">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Secure Payment</h3>
              <p className="text-xs md:text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-md mb-3 md:mb-4">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Quality Products</h3>
              <p className="text-xs md:text-sm text-gray-600">Carefully curated selection</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-md mb-3 md:mb-4">
                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Easy Returns</h3>
              <p className="text-xs md:text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Check out our handpicked selection</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:mt-12">
            <Link
              href="/products"
              className="inline-block px-6 md:px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8">
            Join thousands of happy customers today!
          </p>
          <Link
            href="/products"
            className="inline-block px-6 md:px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ShoppingBag, TrendingUp, Shield, Truck } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

export default function HomePage() {
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { isFeatured: true, limit: 8 },
      });
      return response.data.data.data;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">
              Welcome to Pulss Store
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Discover quality products for your everyday needs. Shop with confidence!
            </p>
            <div className="flex space-x-4">
              <Link
                href="/products"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Shop Now
              </Link>
              <Link
                href="/categories"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quality Products</h3>
              <p className="text-sm text-gray-600">Carefully curated selection</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <ShoppingBag className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Check out our handpicked selection</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of happy customers today!
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}


'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Pill, 
  ShoppingBasket, 
  Store, 
  Target, 
  ArrowRight,
  Package,
  TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Category configuration with custom icons and colors
const categoryConfig = {
  'Pharmacies and chemists': {
    icon: Pill,
    emoji: '🏥',
    color: 'from-red-500 to-pink-600',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    description: 'Health & wellness products for your daily needs'
  },
  'Grocery stores': {
    icon: ShoppingBasket,
    emoji: '🛒',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    description: 'Fresh groceries and daily essentials'
  },
  'Local businesses': {
    icon: Store,
    emoji: '🏪',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    description: 'Supporting your local community'
  },
  'Regional retail chains': {
    icon: Target,
    emoji: '🎯',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    description: 'Trusted brands across the region'
  }
};

function CategoriesPageContent() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data.data;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Browse Categories
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover products from trusted retailers across different categories
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>{stats?.total || 0}+ Products</span>
              </div>
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5" />
                <span>{categories?.length || 0} Categories</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Always Growing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <p className="text-gray-600 mt-6 text-lg">Loading categories...</p>
            </div>
          ) : (
            <>
              {/* Main Categories */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Shop by Category
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {Object.entries(categoryConfig).map(([name, config]) => {
                    const Icon = config.icon;
                    return (
                      <Link
                        key={name}
                        href={`/products?category=${encodeURIComponent(name)}`}
                        className="group"
                      >
                        <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden h-full transform hover:-translate-y-2">
                          {/* Gradient Header */}
                          <div className={`bg-gradient-to-br ${config.color} p-6 text-center`}>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                              <Icon className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-4xl mb-2">{config.emoji}</div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                              {name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                              {config.description}
                            </p>
                            <div className="flex items-center justify-between text-blue-600 font-semibold text-sm">
                              <span>Explore Products</span>
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* All Categories from API */}
              {categories && categories.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    All Product Categories
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {categories.map((category: any) => (
                      <Link
                        key={category.id}
                        href={`/products?categoryId=${category.id}`}
                        className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-center border border-gray-100 hover:border-blue-300"
                      >
                        <div className="text-3xl mb-3">
                          {category.name.includes('Pharmacy') || category.name.includes('Health') ? '🏥' :
                           category.name.includes('Grocery') || category.name.includes('Food') ? '🛒' :
                           category.name.includes('Local') || category.name.includes('Store') ? '🏪' :
                           category.name.includes('Retail') || category.name.includes('Chain') ? '🎯' :
                           '📦'}
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Browse all our products or use the search to find exactly what you need
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/products"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition w-full sm:w-auto"
            >
              View All Products
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition w-full sm:w-auto"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesPageContent />
    </ProtectedRoute>
  );
}


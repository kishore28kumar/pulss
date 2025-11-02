'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { ...filters, page }],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { ...filters, page, limit: 12 },
      });
      return response.data.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
        <p className="text-gray-600">Browse our complete collection</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters({ ...filters, sortBy, sortOrder });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({
                search: '',
                categoryId: '',
                minPrice: '',
                maxPrice: '',
                sortBy: 'createdAt',
                sortOrder: 'desc',
              })}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {data?.data?.length || 0} of {data?.meta?.total || 0} products
                </p>
              </div>

              {/* Products Grid */}
              {data?.data?.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.data.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Page {page} of {data?.meta?.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= (data?.meta?.totalPages || 1)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


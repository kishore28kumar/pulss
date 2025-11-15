'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import FilterDrawer from '@/components/products/FilterDrawer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data || [];
    },
  });

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['products', { ...filters, page }],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { ...filters, page, limit: 24 },
      });
      return response.data.data;
    },
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
          <a href="/" className="hover:text-blue-600 transition">Home</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Products</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
            <p className="text-gray-600">
              {data?.meta?.total ? `Showing ${data.data.length} of ${data.meta.total} products` : 'Browse our complete collection'}
            </p>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition shadow-sm"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 sticky top-24 shadow-sm">
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
                  onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange({ ...filters, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  <option value="">All Categories</option>
                  {categoriesData?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange({ ...filters, minPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange({ ...filters, maxPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                    handleFilterChange({ ...filters, sortBy, sortOrder });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
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
                onClick={() => handleFilterChange({
                  search: '',
                  categoryId: '',
                  minPrice: '',
                  maxPrice: '',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading products...</p>
              </div>
            ) : (
              <>
                {data?.data?.length > 0 ? (
                  <>
                    {/* Products Grid - 2 columns mobile, 3 tablet, 4 desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {data.data.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {data.meta && data.meta.totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          aria-label="Previous page"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Page {page} of {data.meta.totalPages}
                        </span>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= data.meta.totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500 text-lg">No products found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your filters</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categoriesData}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsPageContent />
    </ProtectedRoute>
  );
}

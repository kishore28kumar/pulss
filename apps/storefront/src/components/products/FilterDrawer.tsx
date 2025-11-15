'use client';

import { X, Filter } from 'lucide-react';
import { useState } from 'react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    search: string;
    categoryId: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  categories?: Array<{ id: string; name: string }>;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories = [],
}: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-200 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 id="filter-drawer-title" className="text-xl font-bold text-gray-900">
              Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition"
            aria-label="Close filters"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              value={localFilters.search}
              onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={localFilters.categoryId}
              onChange={(e) => setLocalFilters({ ...localFilters, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice}
                onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice}
                onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setLocalFilters({ ...localFilters, sortBy, sortOrder });
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
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 md:p-6 space-y-3">
          <button
            onClick={handleApplyFilters}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md font-medium hover:border-blue-600 hover:text-blue-600 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </>
  );
}

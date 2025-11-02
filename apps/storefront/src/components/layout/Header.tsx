'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Heart, Store } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const response = await api.get('/cart');
        return response.data.data;
      } catch (error) {
        return { itemCount: 0 };
      }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('customerToken'),
  });

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto">
        {/* Top Bar */}
        <div className="py-2 px-4 bg-blue-600 text-white text-sm text-center">
          🎉 Free shipping on orders over $50!
        </div>

        {/* Main Header */}
        <div className="py-4 px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pulss Store</h1>
                <p className="text-xs text-gray-500">Quality Products</p>
              </div>
            </Link>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Link
                href="/wishlist"
                className="hidden md:flex items-center text-gray-700 hover:text-blue-600 transition"
              >
                <Heart className="w-6 h-6" />
              </Link>

              <Link
                href="/cart"
                className="relative flex items-center text-gray-700 hover:text-blue-600 transition"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartData?.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartData.itemCount}
                  </span>
                )}
              </Link>

              <Link
                href="/account"
                className="hidden md:flex items-center text-gray-700 hover:text-blue-600 transition"
              >
                <User className="w-6 h-6" />
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-8 py-3 border-t border-gray-100">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Home
          </Link>
          <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Shop
          </Link>
          <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Categories
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition">
            Contact
          </Link>
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <nav className="space-y-2">
              <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href="/products" className="block py-2 text-gray-700 hover:text-blue-600">
                Shop
              </Link>
              <Link href="/categories" className="block py-2 text-gray-700 hover:text-blue-600">
                Categories
              </Link>
              <Link href="/account" className="block py-2 text-gray-700 hover:text-blue-600">
                Account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


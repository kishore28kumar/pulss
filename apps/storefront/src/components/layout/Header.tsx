'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Heart, Store, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useTenant } from '@/contexts/TenantContext';
import { getTenantPath } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const storeName = params['store-name'] as string | undefined;
  const { tenant } = useTenant();
  const { customer, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { wishlistCount, isLoaded: wishlistLoaded } = useWishlist();
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => storeName ? `/${storeName}${path}` : path;

  // Track when component has mounted to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

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
    enabled: mounted && isAuthenticated && typeof window !== 'undefined',
    retry: false,
  });

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto">
        {/* Top Bar */}
        <div className="py-2 px-4 bg-blue-600 text-white text-sm text-center">
          🎉 Free shipping on orders over ₹200!
        </div>

        {/* Main Header */}
        <div className="py-4 px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={getPath('/')} className="flex items-center space-x-2">
              {tenant?.logoUrl ? (
                <img src={tenant.logoUrl} alt={tenant.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tenant?.name || 'Pulss Store'}</h1>
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
                href={getPath('/wishlist')}
                className="hidden md:flex items-center relative text-gray-700 hover:text-blue-600 transition"
              >
                <Heart className="w-6 h-6" />
                {mounted && wishlistLoaded && wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href={getPath('/cart')}
                className="relative flex items-center text-gray-700 hover:text-blue-600 transition"
              >
                <ShoppingCart className="w-6 h-6" />
                {mounted && cartData?.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartData.itemCount}
                  </span>
                )}
              </Link>

              {!authLoading && mounted && (
                <>
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href={getPath('/account')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <User className="w-6 h-6" />
                    <span className="text-sm font-medium">{customer?.firstName}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600 transition"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  href={getPath('/login')}
                  className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition"
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium">Login</span>
                </Link>
                  )}
                </>
              )}

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
          <Link href={getPath('/')} className="text-gray-700 hover:text-blue-600 font-medium transition">
            Home
          </Link>
          <Link href={getPath('/products')} className="text-gray-700 hover:text-blue-600 font-medium transition">
            Shop
          </Link>
          <Link href={getPath('/categories')} className="text-gray-700 hover:text-blue-600 font-medium transition">
            Categories
          </Link>
          <Link href={getPath('/about')} className="text-gray-700 hover:text-blue-600 font-medium transition">
            About
          </Link>
          <Link href={getPath('/contact')} className="text-gray-700 hover:text-blue-600 font-medium transition">
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
              <Link href={getPath('/')} className="block py-2 text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href={getPath('/products')} className="block py-2 text-gray-700 hover:text-blue-600">
                Shop
              </Link>
              <Link href={getPath('/categories')} className="block py-2 text-gray-700 hover:text-blue-600">
                Categories
              </Link>
              {!authLoading && mounted && (
                <>
              {isAuthenticated ? (
                <>
                  <Link href={getPath('/account')} className="block py-2 text-gray-700 hover:text-blue-600">
                    Account
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href={getPath('/login')} className="block py-2 text-gray-700 hover:text-blue-600">
                  Login
                </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


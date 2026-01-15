'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Heart, Store, LogOut, ShoppingBag, ShieldCheck, FileText, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useTenant } from '@/contexts/TenantContext';

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
      } catch {
        return { itemCount: 0 };
      }
    },
    enabled: mounted && isAuthenticated && typeof window !== 'undefined',
    retry: false,
  });

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto">
        {/* Regulatory Information Top Bar */}
        {mounted && (tenant?.gstNumber || tenant?.drugLicNumber || tenant?.pharmacistName || tenant?.pharmacistRegNumber) && (
          <div
            className="py-2 px-4 text-white transition-colors duration-300"
            style={{ backgroundColor: tenant?.primaryColor || '#2563eb' }}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-[11px] font-semibold tracking-wider">
              {/* Left Side: Business Licenses */}
              <div className="flex items-center divide-x divide-white/30">
                {tenant?.gstNumber && (
                  <div className="flex items-center space-x-1.5 opacity-95 hover:opacity-100 transition-opacity pr-6">
                    <FileText className="w-3.5 h-3.5 text-blue-100" />
                    <span className="text-blue-100 font-medium">GST NO:</span>
                    <span className="font-bold tracking-normal uppercase">{tenant.gstNumber}</span>
                  </div>
                )}
                {tenant?.drugLicNumber && (
                  <div className="flex items-center space-x-1.5 opacity-95 hover:opacity-100 transition-opacity pl-6">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-100" />
                    <span className="text-blue-100 font-medium">DRUG LICENCE NO:</span>
                    <span className="font-bold tracking-normal uppercase">{tenant.drugLicNumber}</span>
                  </div>
                )}
              </div>

              {/* Right Side: Professional Details */}
              <div className="flex items-center divide-x divide-white/30">
                {tenant?.pharmacistName && (
                  <div className="flex items-center space-x-1.5 opacity-95 hover:opacity-100 transition-opacity pr-6">
                    <UserCheck className="w-3.5 h-3.5 text-blue-100" />
                    <span className="text-blue-100 font-medium tracking-tight">PHARMACIST:</span>
                    <span className="font-extrabold tracking-normal uppercase">{tenant.pharmacistName}</span>
                  </div>
                )}
                {tenant?.pharmacistRegNumber && (
                  <div className="flex items-center space-x-1.5 opacity-95 hover:opacity-100 transition-opacity pl-6">
                    <span className="text-blue-100 font-medium tracking-tight">REG NO:</span>
                    <span className="font-bold tracking-normal uppercase">{tenant.pharmacistRegNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                className="hidden md:flex items-center relative text-gray-700 hover:text-blue-600 transition group"
                title="Wishlist"
              >
                <Heart className="w-6 h-6" />
                {mounted && wishlistLoaded && wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Wishlist
                </span>
              </Link>

              {isAuthenticated && (
                <Link
                  href={getPath('/orders')}
                  className="hidden md:flex items-center relative text-gray-700 hover:text-blue-600 transition group"
                  title="Orders"
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Orders
                  </span>
                </Link>
              )}

              <Link
                href={getPath('/cart')}
                className="relative flex items-center text-gray-700 hover:text-blue-600 transition group"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {mounted && cartData?.itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartData.itemCount}
                  </span>
                )}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Shopping Cart
                </span>
              </Link>

              {!authLoading && mounted && (
                <>
                  {isAuthenticated ? (
                    <div className="hidden md:flex items-center space-x-2">
                      <Link
                        href={getPath('/account')}
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition group relative"
                        title="My Account"
                      >
                        <User className="w-6 h-6" />
                        <span className="text-sm font-medium">{customer?.firstName}</span>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          My Account
                        </span>
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


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, ShoppingBag, Heart, Settings, LogOut, Package } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Manage your account and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 md:p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-md flex items-center justify-center">
                    <User className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold">
                      {customer.firstName} {customer.lastName}
                    </h2>
                    <p className="text-blue-100 text-xs md:text-sm">{customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-blue-600 bg-blue-50 rounded-md font-medium">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <Link 
                  href="/account/orders" 
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-md transition"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Orders & Tracking</span>
                </Link>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-md transition">
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-md transition">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-md transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-gray-900">{customer.email}</p>
                    {customer.emailVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        Verified
                      </span>
                    )}
                    {!customer.emailVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>

                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-md flex items-center justify-center">
                    <Package className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Wishlist</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 rounded-md flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                <Link
                  href="/account/orders"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Orders →
                </Link>
              </div>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
                <p className="text-sm text-gray-400 mt-1">Start shopping to see your orders here</p>
                <button
                  onClick={() => router.push('/products')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AlertTriangle, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);

  // Check if current user is frozen
  const { data: currentUser, error: currentUserError } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.data;
    },
    retry: false,
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Check if user is frozen - 403 error means account is frozen
    if (currentUserError && (currentUserError as any).response?.status === 403) {
      setShowFrozenModal(true);
    }
  }, [currentUserError]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Frozen Account Modal */}
      {showFrozenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
              Account Frozen
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Your account has been frozen. You cannot access the admin dashboard or your storefront.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                Please contact Super Admin for assistance to unfreeze your account.
              </p>
            </div>
            <button
              onClick={() => {
                authService.logout();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-[50] lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-[60] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out transition-colors ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto relative z-10">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


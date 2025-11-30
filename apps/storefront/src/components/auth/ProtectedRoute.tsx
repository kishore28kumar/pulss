'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Extract tenant slug from pathname
      // Path format: /[store-name]/... or /[store-name]
      const pathSegments = pathname?.split('/').filter(Boolean) || [];
      const tenantSlug = pathSegments[0];
      
      if (tenantSlug) {
        // Redirect to tenant-specific login
        router.push(`/${tenantSlug}/login`);
      } else {
        // No tenant context, redirect to home (QR message)
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 animate-pulse">
            <Store className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Extract tenant slug from pathname
    const pathSegments = pathname?.split('/').filter(Boolean) || [];
    const tenantSlug = pathSegments[0];
    const loginPath = tenantSlug ? `/${tenantSlug}/login` : '/';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access this page. Please sign in to continue.
          </p>
          <Link
            href={loginPath}
            className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


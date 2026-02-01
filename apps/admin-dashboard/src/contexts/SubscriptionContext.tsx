'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AuthUser } from '@pulss/types';
import { AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionContextType {
  checkAccess: (requiredFeature?: 'heroCarousel' | 'sponsoredBanner' | 'broadcast') => boolean;
  isSubscriptionActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);

  // Fetch current user details including tenant subscription info
  const { data: user } = useQuery<AuthUser>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.data;
    },
    // We rely on DashboardLayout or other fetchers to keep this fresh too, 
    // but having it here ensures we have data.
    staleTime: 60000, 
    retry: false
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  // Determine if subscription is active
  const isSubscriptionActive = (() => {
    if (!user || !user.tenant) return true; // Fail safe or wait for load? Assume true until loaded to prevent flash? Or false? 
    // If loading, user is undefined. 

    if (isSuperAdmin) return true;

    // Check Status
    if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'EXPIRED') {
      return false;
    }

    // Check Date if not FREE
    if (user.tenant.subscriptionPlan !== 'FREE' && user.tenant.subscriptionEndsAt) {
      const expiryDate = new Date(user.tenant.subscriptionEndsAt);
      if (expiryDate < new Date()) {
        return false;
      }
    }

    return true;
  })();

  const checkAccess = (requiredFeature?: 'heroCarousel' | 'sponsoredBanner' | 'broadcast') => {
    // 1. Check Feature Flag (Manual Toggle)
    // We access 'user' from useQuery above.
    // user.tenant.feature is unknown on AuthUser type so we cast or assume it's there from generic Record<string, any> if mapped.
    // Actually, we added features to the TenantDTO but AuthUser uses a simpler Tenant type.
    // Let's assume the user object includes it now (we haven't updated AuthUser in authService fully but api returns it).
    
    if (requiredFeature && user?.tenant) {

      // Cast to any to access features until type is fully propagated or updated in authService
      // Handle case where features might be a string (if not parsed correctly by API client)
      let tenantFeatures = (user.tenant as any).features;
      
      if (typeof tenantFeatures === 'string') {
        try {
          tenantFeatures = JSON.parse(tenantFeatures);
        } catch (e) {
          // Ignore parsing error, will fail check below
        }
      }

      if (tenantFeatures && tenantFeatures[requiredFeature] === false) {
         // Feature explicitly disabled
         toast.error("This feature has been disabled for your account.");
         return false;
      }
    }

    // 2. Check Subscription
    if (!isSubscriptionActive) {
      setShowModal(true);
      return false;
    }
    return true;
  };

  return (
    <SubscriptionContext.Provider value={{ checkAccess, isSubscriptionActive }}>
      {children}

      {/* Subscription Required Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative">
             <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 mx-auto">
              <CreditCard className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
              Subscription Required
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Your subscription has expired or is inactive. This feature is only available for active subscribers.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Please contact support or upgrade your plan.
              </p>
            </div>

            <div className="flex gap-3">
               <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
              <button
                // In a real app, redirect to billing
                // onClick={() => router.push('/dashboard/settings/billing')}
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

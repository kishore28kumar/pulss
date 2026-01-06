'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface TenantContextType {
  tenantSlug: string | null;
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract tenant slug from URL path
    // Path format: /[store-name]/... or /[store-name]
    const pathSegments = pathname.split('/').filter(Boolean);
    const slug = pathSegments[0] || null;

    setTenantSlug(slug);
    setIsLoading(true);
    setError(null);

    if (slug) {
      // Fetch tenant info
      const fetchTenant = async () => {
        try {
          // Temporarily set tenant slug in API client
          const response = await api.get('/tenants/info', {
            headers: {
              'X-Tenant-Slug': slug,
            },
          });
          setTenant(response.data.data);
          setError(null);
        } catch (err: any) {
          console.error('Failed to fetch tenant:', err);
          setError(err.response?.data?.error || 'Tenant not found');
          setTenant(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTenant();
    } else {
      setIsLoading(false);
    }
  }, [pathname]);

  return (
    <TenantContext.Provider value={{ tenantSlug, tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}


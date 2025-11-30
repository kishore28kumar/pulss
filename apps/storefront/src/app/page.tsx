'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Store, ArrowRight, Building2 } from 'lucide-react';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  status: string;
}

export default function HomePage() {
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      // This endpoint should be accessible without tenant context
      // For now, we'll need to create a public endpoint or handle this differently
      // Since SUPER_ADMIN can access /tenants, we'll need a public version
      try {
        const response = await api.get('/tenants');
        return response.data.data.filter((t: Tenant) => t.status === 'ACTIVE');
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        return [];
      }
    },
    retry: false,
  });

    return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <Store className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Pulss
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Multi-tenant e-commerce platform. Choose a store to start shopping.
          </p>
        </div>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading stores...</p>
          </div>
        ) : tenants && tenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/${tenant.slug}`}
                className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {tenant.logoUrl ? (
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-gray-500">@{tenant.slug}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </div>
                <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                  <span>Visit Store</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No stores available at the moment.</p>
            </div>
          )}
        </div>
    </div>
  );
}

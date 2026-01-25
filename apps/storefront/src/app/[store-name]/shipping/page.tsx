'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTenant } from '@/contexts/TenantContext';
import FormattedContent from '@/components/content/FormattedContent';
import { DEFAULT_SHIPPING_CONTENT } from '@/lib/contentDefaults';

function ShippingPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const shippingContent = tenant?.pageContent?.shipping || DEFAULT_SHIPPING_CONTENT;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
            <FormattedContent text={shippingContent} />
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-gray-600 mb-4">Have questions about shipping?</p>
          <Link
            href={getPath('/contact')}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ShippingPage() {
  return (
    <ProtectedRoute>
      <ShippingPageContent />
    </ProtectedRoute>
  );
}


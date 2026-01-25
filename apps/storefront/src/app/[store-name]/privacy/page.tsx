'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTenant } from '@/contexts/TenantContext';
import FormattedContent from '@/components/content/FormattedContent';

function PrivacyPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const privacyContent = tenant?.pageContent?.privacy;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
            {privacyContent ? (
              <FormattedContent text={privacyContent} />
            ) : (
              <div className="text-gray-600 text-center py-8">
                <p>Privacy policy will be available soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Privacy?</h2>
          <p className="text-gray-600 mb-6">
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us.
          </p>
          <Link
            href={getPath('/contact')}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <ProtectedRoute>
      <PrivacyPageContent />
    </ProtectedRoute>
  );
}


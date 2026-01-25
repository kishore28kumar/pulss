'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTenant } from '@/contexts/TenantContext';
import FormattedFAQ from '@/components/content/FormattedFAQ';
import { DEFAULT_FAQ_CONTENT } from '@/lib/contentDefaults';

function FAQPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const faqContent = tenant?.pageContent?.faq || DEFAULT_FAQ_CONTENT;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products, shipping, returns, and more.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          <FormattedFAQ text={faqContent} />

          {/* Still Have Questions */}
          <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our support team is here to help!
            </p>
            <Link
              href={getPath('/contact')}
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <ProtectedRoute>
      <FAQPageContent />
    </ProtectedRoute>
  );
}


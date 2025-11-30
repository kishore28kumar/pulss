'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function TermsPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: CheckCircle,
      content: 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.'
    },
    {
      title: 'Use License',
      icon: FileText,
      content: 'Permission is granted to temporarily access the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.'
    },
    {
      title: 'Product Information',
      icon: AlertTriangle,
      content: 'We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions or other content on this site is accurate, complete, reliable, current, or error-free.'
    },
    {
      title: 'Pricing and Payment',
      icon: Scale,
      content: 'All prices are listed in Indian Rupees (₹) and are subject to change without notice. We reserve the right to refuse or cancel any order at any time. Payment must be received before order processing.'
    },
    {
      title: 'Order Cancellation',
      icon: AlertTriangle,
      content: 'We reserve the right to cancel any order for any reason. If your order is cancelled, we will notify you and refund any payment made. You may cancel your order before it ships by contacting customer support.'
    },
    {
      title: 'Limitation of Liability',
      icon: Scale,
      content: 'In no event shall Pulss or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.'
    },
    {
      title: 'Intellectual Property',
      icon: FileText,
      content: 'All content on this website, including text, graphics, logos, images, and software, is the property of Pulss or its content suppliers and is protected by copyright and trademark laws.'
    },
    {
      title: 'Governing Law',
      icon: Scale,
      content: 'These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes relating to these terms shall be subject to the exclusive jurisdiction of the courts in India.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-700 leading-relaxed">
              Please read these Terms and Conditions carefully before using our website. By accessing or using our services, you agree to be bound by these terms. If you disagree with any part of these terms, you may not access our services.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-gray-700 leading-relaxed ml-16">{section.content}</p>
              </div>
            );
          })}
        </div>

        {/* Important Notes */}
        <div className="max-w-4xl mx-auto mt-12 bg-yellow-50 rounded-xl border border-yellow-200 p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Important Notes</h2>
              <ul className="space-y-2 text-gray-700">
                <li>• We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.</li>
                <li>• Your continued use of our services after changes are posted constitutes acceptance of the modified terms.</li>
                <li>• If any provision of these terms is found to be invalid, the remaining provisions will remain in full effect.</li>
                <li>• These terms constitute the entire agreement between you and Pulss regarding your use of our services.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Terms?</h2>
          <p className="text-gray-600 mb-6">
            If you have questions about these Terms & Conditions, please contact us.
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

export default function TermsPage() {
  return (
    <ProtectedRoute>
      <TermsPageContent />
    </ProtectedRoute>
  );
}


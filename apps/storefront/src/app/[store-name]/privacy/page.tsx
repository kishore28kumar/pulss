'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function PrivacyPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const sections = [
    {
      title: 'Information We Collect',
      icon: FileText,
      content: [
        'Personal information (name, email, phone number, address)',
        'Payment information (processed securely through our payment partners)',
        'Order history and preferences',
        'Device information and browsing behavior',
        'Cookies and tracking technologies'
      ]
    },
    {
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        'Process and fulfill your orders',
        'Communicate with you about your orders and account',
        'Send you marketing communications (with your consent)',
        'Improve our website and services',
        'Prevent fraud and ensure security',
        'Comply with legal obligations'
      ]
    },
    {
      title: 'Information Sharing',
      icon: Lock,
      content: [
        'We do not sell your personal information to third parties',
        'We may share information with service providers who assist us in operating our business',
        'We may disclose information if required by law or to protect our rights',
        'In case of business transfer, your information may be transferred to the new owner'
      ]
    },
    {
      title: 'Your Rights',
      icon: Shield,
      content: [
        'Access your personal information',
        'Correct inaccurate information',
        'Request deletion of your information',
        'Opt-out of marketing communications',
        'Request data portability',
        'File a complaint with regulatory authorities'
      ]
    }
  ];

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

        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              At Pulss, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our website, you consent to the data practices described in this policy. If you do not agree with the practices described in this policy, please do not use our services.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Security */}
        <div className="max-w-4xl mx-auto mt-12 bg-blue-50 rounded-xl border border-blue-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We use SSL encryption for data transmission and secure payment processing. Your payment information is handled by trusted third-party payment processors and is never stored on our servers.
          </p>
        </div>

        {/* Cookies */}
        <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Types of cookies we use:
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Essential cookies (required for site functionality)</li>
            <li>Analytics cookies (help us understand site usage)</li>
            <li>Marketing cookies (used for targeted advertising)</li>
          </ul>
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


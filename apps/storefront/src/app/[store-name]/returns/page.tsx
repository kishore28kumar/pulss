'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Clock, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useTenant } from '@/contexts/TenantContext';

function ReturnsPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const returnSteps = [
    {
      step: 1,
      title: 'Initiate Return',
      description: 'Log into your account, go to Orders, and click "Return" on the item you want to return.',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      step: 2,
      title: 'Get Return Label',
      description: 'We\'ll provide you with a return shipping label. Print it and attach it to your package.',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      step: 3,
      title: 'Ship Your Return',
      description: 'Drop off your package at any authorized shipping location or schedule a pickup.',
      icon: RotateCcw,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      step: 4,
      title: 'Receive Refund',
      description: 'Once we receive and inspect your return, we\'ll process your refund within 5-7 business days.',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <RotateCcw className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our hassle-free return policy ensures you're satisfied with your purchase.
          </p>
        </div>

        {/* Return Policy Summary */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {tenant?.returnPolicy ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {tenant.returnPolicy}
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Return Policy</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">30-Day Return Window</h3>
                      <p className="text-gray-600">You have 30 days from the date of delivery to initiate a return.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Original Condition Required</h3>
                      <p className="text-gray-600">Items must be unused, unwashed, and in original packaging with tags attached.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Free Return Shipping</h3>
                      <p className="text-gray-600">We provide free return shipping labels for eligible returns.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Quick Refund Processing</h3>
                      <p className="text-gray-600">Refunds are processed within 5-7 business days after we receive your return.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Return Process */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Return an Item</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className="text-gray-600 mb-4">Need help with a return?</p>
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

export default function ReturnsPage() {
  return (
    <ProtectedRoute>
      <ReturnsPageContent />
    </ProtectedRoute>
  );
}


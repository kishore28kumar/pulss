'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Truck, Package, Clock, MapPin, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function ShippingPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const shippingOptions = [
    {
      name: 'Standard Shipping',
      duration: '3-5 business days',
      cost: '₹5.99',
      freeThreshold: 'Free on orders over ₹50',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Express Shipping',
      duration: '1-2 business days',
      cost: '₹15.99',
      freeThreshold: 'Free on orders over ₹100',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Same Day Delivery',
      duration: 'Same day (if ordered before 12 PM)',
      cost: '₹25.99',
      freeThreshold: 'Available in select cities',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const shippingInfo = [
    {
      title: 'Processing Time',
      description: 'Orders are typically processed within 1-2 business days. You\'ll receive an email confirmation once your order is shipped.',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Tracking Your Order',
      description: 'Once your order ships, you\'ll receive a tracking number via email. You can track your order in real-time through our website.',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Delivery Areas',
      description: 'We currently ship to all major cities and towns across India. Some remote areas may have extended delivery times.',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn about our shipping options, delivery times, and tracking your orders.
          </p>
        </div>

        {/* Shipping Options */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {shippingOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className={`w-12 h-12 ${option.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
                  <p className="text-gray-600 mb-2"><strong>Duration:</strong> {option.duration}</p>
                  <p className="text-gray-600 mb-2"><strong>Cost:</strong> {option.cost}</p>
                  <p className="text-sm text-green-600 font-medium">{option.freeThreshold}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Information */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Information</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {shippingInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className={`w-12 h-12 ${info.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${info.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-gray-600">{info.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping FAQs</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">When will my order arrive?</h3>
              <p className="text-gray-600">
                Delivery times vary based on your location and the shipping method selected. Standard shipping typically takes 3-5 business days, while express shipping takes 1-2 business days.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I track my order?</h3>
              <p className="text-gray-600">
                Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and visiting the "Orders" section.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if my order is delayed?</h3>
              <p className="text-gray-600">
                If your order is delayed beyond the estimated delivery date, please contact our customer support team. We'll investigate and keep you updated on the status.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you ship to P.O. boxes?</h3>
              <p className="text-gray-600">
                Yes, we can ship to P.O. boxes. However, please note that some shipping methods may not be available for P.O. box addresses.
              </p>
            </div>
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


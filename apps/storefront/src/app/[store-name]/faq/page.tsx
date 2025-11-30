'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function FAQPageContent() {
  const params = useParams();
  const storeName = params['store-name'] as string;
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'You can place an order by browsing our products, adding items to your cart, and proceeding to checkout. Make sure you\'re logged in to your account first.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery (COD), Credit, and Online Payment methods including UPI, Net Banking, and Wallet payments.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout for faster delivery.'
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes! Once your order is shipped, you\'ll receive a tracking number via email. You can also track your order in the "Orders" section of your account.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging. Please visit our Returns page for detailed information.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within India. We\'re working on expanding our shipping options to other countries soon.'
    },
    {
      question: 'How can I cancel my order?',
      answer: 'You can cancel your order from the "Orders" section in your account if it hasn\'t been shipped yet. Once shipped, you\'ll need to initiate a return.'
    },
    {
      question: 'Are there any discounts or promotions?',
      answer: 'Yes! We regularly offer discounts and promotions. Subscribe to our newsletter and follow us on social media to stay updated on the latest deals.'
    },
    {
      question: 'How do I create an account?',
      answer: 'You can create an account by clicking the "Sign Up" button on the login page. Simply provide your email, password, and basic information to get started.'
    },
    {
      question: 'What if I receive a damaged product?',
      answer: 'If you receive a damaged product, please contact our customer support immediately with photos of the damage. We\'ll arrange a replacement or refund as per our policy.'
    },
    {
      question: 'Can I modify my order after placing it?',
      answer: 'You can modify or cancel your order within a few hours of placing it, provided it hasn\'t been processed yet. Contact our support team for assistance.'
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach our customer support team through the Contact page, email, or phone. Our team is available Monday-Friday, 9 AM - 6 PM.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

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


'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface HeroSectionProps {
  isAuthenticated?: boolean;
  customerName?: string;
}

/**
 * Conversion-Focused Ecommerce Hero Section
 * 
 * Design Principles:
 * - Clear value proposition in headline
 * - Supporting benefits in subheadline
 * - Strong visual hierarchy with CTAs
 * - Trust indicators (badge, features)
 * - Responsive image-text layout
 * - Conversion-optimized spacing and contrast
 */
export default function HeroSection({ isAuthenticated, customerName }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column: Content */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8">
            {/* Promotional Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>New Arrival - 20% Off First Order</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {isAuthenticated && customerName ? (
                <>
                  Welcome back, <span className="text-blue-600">{customerName}</span>!
                </>
              ) : (
                <>
                  Quality Products, <span className="text-blue-600">Delivered Fast</span>
                </>
              )}
            </h1>

            {/* Subheadline with Benefits */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Discover premium products from trusted local retailers. 
              <span className="text-gray-900 font-semibold"> Free shipping</span> on orders over ₹200, 
              <span className="text-gray-900 font-semibold"> secure checkout</span>, and 
              <span className="text-gray-900 font-semibold"> 30-day returns</span> guaranteed.
            </p>

            {/* Trust Indicators */}
            {/* <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium">10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium">5,000+ Products</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium">50+ Local Partners</span>
              </div>
            </div> */}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              {/* Primary CTA */}
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary CTA */}
              <Link
                href={isAuthenticated ? "/categories" : "/login"}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {isAuthenticated ? "Browse Categories" : "Create Account"}
              </Link>
            </div>

            {/* Additional Trust Elements */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free Returns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className="relative order-first lg:order-last">
            <div className="relative aspect-square max-w-lg mx-auto lg:max-w-none">
              {/* Main Product Image Container */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
                {/* Placeholder Image - Replace with actual product image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
                  <Image
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop&q=80"
                    alt="Premium products showcase"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                {/* Overlay Gradient for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>

              {/* Floating Badge Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-xl animate-bounce hidden sm:block">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">✓</span>
                </div>
                <p className="text-xs font-semibold text-gray-900 mt-2 text-center">Verified</p>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-500"
                      />
                    ))}
                  </div>
                  {/* <div>
                    <p className="text-xs font-semibold text-gray-900">10,000+</p>
                    <p className="text-xs text-gray-600">Happy Customers</p>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 -left-8 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl hidden lg:block"></div>
            <div className="absolute bottom-1/4 -right-8 w-40 h-40 bg-indigo-200/30 rounded-full blur-2xl hidden lg:block"></div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
    </section>
  );
}


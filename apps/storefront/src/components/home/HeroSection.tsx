
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

interface HeroSectionProps {
  isAuthenticated?: boolean;
  customerName?: string;
}

export default function HeroSection({ isAuthenticated, customerName }: HeroSectionProps) {
  const params = useParams();
  const router = useRouter();
  const storeName = params['store-name'] as string;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch active ads
  const { data: adData } = useQuery({
    queryKey: ['activeAds'],
    queryFn: async () => {
      try {
        const response = await api.get('/ads/active');
        return response.data.data;
      } catch (err) {
        console.error('Failed to fetch ads', err);
        return null;
      }
    },
    // Don't retry too much for public page
    retry: 1
  });

  const images = adData?.images || [];
  const links = adData?.links || [];
  const hasAds = images.length > 0;

  // Default image if no ads
  const defaultImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop&q=80";

  const displayImages = hasAds ? images : [defaultImage];
  const displayLinks = hasAds ? links : [];

  // Auto-slide logic
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [displayImages.length]);

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
              <span>
                {hasAds ? (adData.title || "Special Offer") : "New Arrival - 20% Off First Order"}
              </span>
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
              {hasAds && adData.description ? adData.description : (
                <>
                  Discover premium products from trusted local retailers.
                  <span className="text-gray-900 font-semibold"> Free shipping</span> on orders over ₹200,
                  <span className="text-gray-900 font-semibold"> secure checkout</span>, and
                  <span className="text-gray-900 font-semibold"> 30-day returns</span> guaranteed.
                </>
              )}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                href={`/${storeName}/products`}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={isAuthenticated ? `/${storeName}/categories` : `/${storeName}/login`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                {isAuthenticated ? "Browse Categories" : "Create Account"}
              </Link>
            </div>

            {/* Trust Elements */}
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

          {/* Right Column: Hero Image / Slider */}
          <div className="relative order-first lg:order-last">
            <div className="relative aspect-square max-w-lg mx-auto lg:max-w-none">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 group">
                {/* Images */}
                {displayImages.map((img: string, idx: number) => {
                  const link = displayLinks?.[idx];
                  const isLinked = !!link;

                  return (
                    <div
                      key={idx}
                      className={`absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        } ${isLinked ? 'cursor-pointer' : 'cursor-default'}`}
                      onClick={() => {
                        if (isLinked) {
                          // Redirection with product name search
                          router.push(`/${storeName}/products?search=${encodeURIComponent(link)}`);
                        }
                      }}
                    >
                      <Image
                        src={img}
                        alt={`Showcase ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                        priority={idx === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />

                    </div>
                  );
                })}

                {/* Slide Indicators */}
                {displayImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                    {displayImages.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10"></div>
              </div>

              {/* Floating Badge (Only show if default image or specifically requested to show always) */}
              {!hasAds && (
                <>
                  <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-xl animate-bounce hidden sm:block z-30">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">✓</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 mt-2 text-center">Verified</p>
                  </div>

                  <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl hidden sm:block z-30">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-500"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Decorative Elements */}
              <div className="absolute top-1/2 -left-8 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl hidden lg:block"></div>
              <div className="absolute bottom-1/4 -right-8 w-40 h-40 bg-indigo-200/30 rounded-full blur-2xl hidden lg:block"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent via-white/50 to-white"></div>
    </section>
  );
}

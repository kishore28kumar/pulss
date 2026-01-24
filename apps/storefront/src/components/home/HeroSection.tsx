
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';

interface HeroSectionProps {
  isAuthenticated?: boolean;
  customerName?: string;
}

export default function HeroSection({}: HeroSectionProps) {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use tenant hero images, fallback to default images
  const tenantHeroImages = tenant?.heroImages || [];
  const tenantHeroKeywords = tenant?.heroImageKeywords || [];
  const hasHeroImages = tenantHeroImages.length > 0;

  // Default images if no hero images uploaded
  const defaultImages = [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&h=800&fit=crop&q=80",
  ];

  const displayImages = hasHeroImages ? tenantHeroImages : defaultImages;

  // Auto-slide logic
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [displayImages.length]);

  return (
    <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Hero Image / Slider */}
      <div className="relative w-full">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
          <div className="relative w-full h-full overflow-hidden rounded-xl group">
            {/* Images */}
            {displayImages.map((img: string, idx: number) => {
              const keyword = hasHeroImages && tenantHeroKeywords[idx] ? tenantHeroKeywords[idx] : null;
              const href = keyword 
                ? `/${storeName}/products?search=${encodeURIComponent(keyword)}`
                : `/${storeName}/products`;
              
              return (
                <Link
                  key={idx}
                  href={href}
                  className={`absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 transition-opacity duration-1000 ease-in-out cursor-pointer ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                  <Image
                    src={img}
                    alt={`Hero Image ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                    priority={idx === 0}
                    sizes="100vw"
                  />
                </Link>
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
        </div>
      </div>
    </section>
  );
}

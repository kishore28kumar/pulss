'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';

interface SponsoredSectionProps {
  isAuthenticated?: boolean;
  customerName?: string;
}

export default function SponsoredSection({}: SponsoredSectionProps) {
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Extract Sponsored Images
  let displayImages: string[] = [];
  if (tenant?.heroImages && typeof tenant.heroImages === 'object' && !Array.isArray(tenant.heroImages)) {
    displayImages = tenant.heroImages.sponsoredBannerImages || [];
  }

  // Auto-slide logic
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [displayImages.length]);

  if (displayImages.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 mt-8 mb-8">
      {/* Banner / Slider */}
      <div className="relative w-full">
        <div className="relative w-full aspect-[4/1] sm:aspect-[6/1] lg:aspect-[8/1]">
          <div className="relative w-full h-full overflow-hidden rounded-xl group">
            {/* Images */}
            {displayImages.map((img: string, idx: number) => {
              // We reuse heroImageKeywords logic if applicable, or default to general search
              // Ideally sponsored banners might have their own links, but sticking to existing pattern:
              // For now, let's link to sponsored products page
               const href = `/${storeName}/products?isSponsored=true`;
              
              return (
                <Link
                  key={idx}
                  href={href}
                  className={`absolute inset-0 bg-gray-100 transition-opacity duration-1000 ease-in-out cursor-pointer ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                  <Image
                    src={img}
                    alt={`Sponsored Banner ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    sizes="100vw"
                  />
                </Link>
              );
            })}

            {/* Slide Indicators */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-2">
                {displayImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

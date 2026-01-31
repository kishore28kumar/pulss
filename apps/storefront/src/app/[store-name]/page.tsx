'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, TrendingUp, Shield, Truck, UserCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import HeroSection from '@/components/home/HeroSection';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export default function StoreHomePage() {
  const router = useRouter();
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { isLoading: tenantLoading } = useTenant();
  const { isAuthenticated, customer, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && storeName) {
      router.push(`/${storeName}/login`);
    }
  }, [isAuthenticated, authLoading, router, storeName]);

  const { data: featuredProducts, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products', storeName],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { isFeatured: true, limit: 8 },
      });
      return response.data.data.data;
    },
    enabled: isAuthenticated && typeof window !== 'undefined' && !!storeName,
    retry: false,
  });

  const { data: sponsoredProducts, isLoading: sponsoredLoading } = useQuery({
    queryKey: ['sponsored-products', storeName],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { isSponsored: true, limit: 8 },
      });
      return response.data.data.data;
    },
    enabled: isAuthenticated && typeof window !== 'undefined' && !!storeName,
    retry: false,
  });

  // Show loading state while tenant is loading or auth is loading
  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  // Show loading/redirecting state if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Conversion-Focused */}
      <HeroSection
        isAuthenticated={isAuthenticated}
        customerName={customer?.firstName}
      />

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-blue-100 rounded-full mb-2 md:mb-4">
                <Truck className="w-5 h-5 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">Free Shipping</h3>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">On orders over ₹50</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-green-100 rounded-full mb-2 md:mb-4">
                <Shield className="w-5 h-5 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">Secure Payment</h3>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-purple-100 rounded-full mb-2 md:mb-4">
                <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">Quality Products</h3>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">Carefully curated selection</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-orange-100 rounded-full mb-2 md:mb-4">
                <ShoppingBag className="w-5 h-5 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">Easy Returns</h3>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">30-day return policy</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-teal-100 rounded-full mb-2 md:mb-4">
                <UserCheck className="w-5 h-5 md:w-8 md:h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-base">Pharmacist Verified</h3>
              <p className="text-xs md:text-sm text-gray-600 hidden md:block">All orders verified by our registered pharmacist before dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Featured Products</h2>
            <p className="text-sm md:text-base text-gray-600">Check out our handpicked selection</p>
          </div>

          {featuredLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading products...</p>
            </div>
          ) : (
            <>
              {/* Mobile Slider */}
              <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-4 snap-x snap-mandatory scroll-smooth pb-4">
                  {featuredProducts?.map((product: any) => (
                    <div key={product.id} className="flex-shrink-0 w-[75%] snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts?.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sponsored Products */}
      {(sponsoredLoading || (sponsoredProducts && sponsoredProducts.length > 0)) && (
        <section className="py-8 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Sponsored Products</h2>
              <p className="text-sm md:text-base text-gray-600">Special promotions and featured offers</p>
            </div>

            {sponsoredLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Loading products...</p>
              </div>
            ) : (
              <>
                {/* Mobile Slider */}
                <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                  <div className="flex gap-4 snap-x snap-mandatory scroll-smooth pb-4">
                    {sponsoredProducts?.map((product: any) => (
                      <div key={product.id} className="flex-shrink-0 w-[75%] snap-start">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {sponsoredProducts?.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}

            <div className="text-center mt-8 md:mt-12">
              <Link
                href={`/${storeName}/products`}
                className="inline-block px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View All Products
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


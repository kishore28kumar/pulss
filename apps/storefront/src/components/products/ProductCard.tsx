'use client';

import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success('Product added to cart!');
    // Implement add to cart logic
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success('Added to wishlist!');
    // Implement add to wishlist logic
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.thumbnail || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleAddToWishlist}
              className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
            >
              <Heart className="w-5 h-5 text-gray-700 hover:text-red-600" />
            </button>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {product.isFeatured && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                Featured
              </span>
            )}
            {product.compareAtPrice && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                Sale
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
            {product.name}
          </h3>
          
          {product.categories?.[0] && (
            <p className="text-xs text-gray-500 mb-2">
              {product.categories[0].category.name}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(product.price))}
              </span>
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatCurrency(Number(product.compareAtPrice))}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="mb-3">
            {product.stockQuantity > 0 ? (
              <span className="text-xs text-green-600 font-medium">
                In Stock ({product.stockQuantity} available)
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity === 0}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </Link>
  );
}


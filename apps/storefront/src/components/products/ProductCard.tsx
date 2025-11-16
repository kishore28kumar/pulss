'use client';

import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, isLoaded } = useWishlist();
  const isWishlisted = isLoaded && isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ productId: product.id, quantity: 1 });
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        thumbnail: product.thumbnail,
      });
    }
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
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-full shadow-md transition ${
                isLoaded && isWishlisted 
                  ? 'bg-red-50' 
                  : 'bg-white opacity-0 group-hover:opacity-100'
              }`}
            >
              <Heart 
                className={`w-5 h-5 transition ${
                  isLoaded && isWishlisted 
                    ? 'text-red-600 fill-red-600' 
                    : 'text-gray-700 hover:text-red-600'
                }`} 
              />
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
            {product.stock > 0 ? (
              <span className="text-xs text-green-600 font-medium">
                In Stock {product.stock < 10 ? `(${product.stock} left)` : ''}
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAddingToCart}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}


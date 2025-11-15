'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { useWishlist } from '@/hooks/useWishlist';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    comparePrice?: number;
    compareAtPrice?: number;
    thumbnail?: string;
    images?: string[];
    stock: number;
    stockQuantity?: number;
    isFeatured?: boolean;
    categories?: Array<{ category?: { name: string } }>;
    rating?: number;
    reviewCount?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCartStore();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);
  const inStock = (product.stock || product.stockQuantity || 0) > 0;
  const stock = product.stock || product.stockQuantity || 0;
  const comparePrice = product.comparePrice || product.compareAtPrice;
  const discount = comparePrice 
    ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
    : 0;
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      thumbnail: product.thumbnail,
      images: product.images,
      stock: stock,
    }, 1);
    
    toast.success('Added to cart');
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
        thumbnail: product.thumbnail || product.images?.[0] || '',
      });
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(e);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <article
        className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 relative h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container - Bigger */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.thumbnail || product.images?.[0] ? (
            <Image
              src={product.thumbnail || product.images?.[0] || ''}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
            </div>
          )}
          
          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
              -{discount}%
            </div>
          )}

          {/* Featured Badge */}
          {product.isFeatured && !discount && (
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
              Featured
            </div>
          )}

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute top-3 right-3 bg-gray-900 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
              Out of Stock
            </div>
          )}

          {/* Wishlist Heart Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-md shadow-sm transition-all ${
              isWishlisted 
                ? 'bg-red-50 opacity-100' 
                : 'bg-white opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-5 h-5 transition ${
                isWishlisted 
                  ? 'text-red-600 fill-red-600' 
                  : 'text-gray-700'
              }`} 
            />
          </button>

          {/* Quick Add Button (Desktop Hover) */}
          {isHovered && inStock && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 border-t border-gray-200">
              <button
                onClick={handleQuickAdd}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 flex flex-col">
          {/* Category */}
          {product.categories?.[0]?.category?.name && (
            <p className="text-xs text-gray-500 mb-1 line-clamp-1">
              {product.categories[0].category.name}
            </p>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition min-h-[2.5rem] text-sm md:text-base">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {rating.toFixed(1)}
              {reviewCount > 0 && ` (${reviewCount})`}
            </span>
          </div>

          {/* Price Hierarchy */}
          <div className="mb-3 mt-auto">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              {comparePrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(comparePrice)}
                </span>
              )}
            </div>
            {comparePrice && (
              <span className="text-xs text-green-600 font-medium">
                Save {formatCurrency(comparePrice - product.price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-3">
            {inStock ? (
              <span className="text-xs text-green-600 font-medium">
                In Stock {stock < 10 ? `(${stock} left)` : ''}
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>
        </div>
      </article>
    </Link>
  );
}

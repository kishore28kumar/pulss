'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  ShoppingCart, 
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';

function WishlistPageContent() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart, isAddingToCart } = useCart();
  const [movingToCart, setMovingToCart] = useState<Set<string>>(new Set());

  const handleRemoveFromWishlist = (productId: string) => {
    if (confirm('Remove this item from your wishlist?')) {
      removeFromWishlist(productId);
    }
  };

  const handleMoveToCart = async (productId: string) => {
    setMovingToCart(prev => new Set(prev).add(productId));
    
    try {
      addToCart({ productId, quantity: 1 });
      // Remove from wishlist after successfully adding to cart
      setTimeout(() => {
        removeFromWishlist(productId);
      }, 500);
    } catch {
      // Error handled by useCart hook
    } finally {
      setTimeout(() => {
        setMovingToCart(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 500);
    }
  };

  const handleClearWishlist = () => {
    if (confirm('Clear all items from your wishlist?')) {
      clearWishlist();
    }
  };

  const isEmpty = wishlist.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-pink-100 rounded-full mb-6">
                <Heart className="w-12 h-12 text-pink-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h1>
              <p className="text-gray-600 mb-8">
                Save your favorite items here so you can easily find them later. Start adding products you love!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Browse Products
                </Link>
                <Link
                  href="/categories"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition"
                >
                  View Categories
                </Link>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Save for Later</h3>
                <p className="text-sm text-gray-600">
                  Keep track of products you're interested in
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Price Tracking</h3>
                <p className="text-sm text-gray-600">
                  Get notified when prices drop on saved items
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Stock Alerts</h3>
                <p className="text-sm text-gray-600">
                  Know when out-of-stock items are available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">{wishlist.length} items saved</p>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="text-red-600 hover:text-red-700 font-medium transition"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                <Link href={`/products/${item.slug}`}>
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFromWishlist(item.productId)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition group/btn"
                >
                  <Heart className="w-5 h-5 text-pink-600 fill-pink-600 group-hover/btn:text-red-600 group-hover/btn:fill-red-600 transition" />
                </button>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <Link 
                  href={`/products/${item.slug}`}
                  className="block mb-2"
                >
                  <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition">
                    {item.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleMoveToCart(item.productId)}
                    disabled={movingToCart.has(item.productId) || isAddingToCart}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {movingToCart.has(item.productId) 
                        ? 'Adding...' 
                        : 'Add to Cart'}
                    </span>
                  </button>
                  
                  <Link
                    href={`/products/${item.slug}`}
                    className="w-full block text-center px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-blue-600 hover:text-blue-600 transition"
                  >
                    View Details
                  </Link>
                </div>

                {/* Added Date */}
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition"
          >
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <ProtectedRoute>
      <WishlistPageContent />
    </ProtectedRoute>
  );
}


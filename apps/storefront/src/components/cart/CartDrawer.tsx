'use client';

import { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';

export default function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const { addToCart: addToCartAPI, updateQuantity: updateQuantityAPI, removeFromCart: removeFromCartAPI } = useCart();

  // Sync local cart to server when user is authenticated
  useEffect(() => {
    if (isAuthenticated && items.length > 0) {
      // Sync each item to server
      items.forEach(item => {
        // This would ideally be done in a batch, but for now we'll sync on add/update
      });
    }
  }, [isAuthenticated, items]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (isAuthenticated) {
      // Find the cart item ID from server
      // For now, update locally and sync
      updateQuantity(productId, newQuantity);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (isAuthenticated) {
      // Find and remove from server
      removeFromCartAPI(productId);
    }
    removeItem(productId);
  };

  const handleCheckout = () => {
    closeCart();
    // Navigate to checkout
    window.location.href = '/cart';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-200 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 id="cart-drawer-title" className="text-xl font-bold text-gray-900">
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-md transition"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">Start adding items to your cart</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition"
                >
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.productSlug}`}
                    onClick={closeCart}
                    className="flex-shrink-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={closeCart}
                      className="block"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition text-sm">
                        {item.productName}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatCurrency(item.price)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-1 text-sm font-medium min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 md:p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Continue Shopping */}
            <Link
              href="/products"
              onClick={closeCart}
              className="block w-full text-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md font-medium hover:border-blue-600 hover:text-blue-600 transition"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

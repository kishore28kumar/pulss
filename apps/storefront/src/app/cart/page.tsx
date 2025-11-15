'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingCart,
  Package,
  CreditCard,
  Truck,
  Shield
} from 'lucide-react';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  quantity: number;
  price: number;
  total: number;
  stockQuantity: number;
  isActive: boolean;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

function CartPageContent() {
  const queryClient = useQueryClient();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const { data: cartData, isLoading } = useQuery<CartData>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await api.put(`/cart/${itemId}`, { quantity });
      return response.data;
    },
    onMutate: ({ itemId }) => {
      setUpdatingItems(prev => new Set(prev).add(itemId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update cart');
    },
    onSettled: (_data, _error, { itemId }) => {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete(`/cart/${itemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove item');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/cart');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
  });

  const handleUpdateQuantity = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string) => {
    if (confirm('Remove this item from cart?')) {
      removeItemMutation.mutate(itemId);
    }
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from cart?')) {
      clearCartMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const isEmpty = !cartData?.items?.length;
  const tax = cartData ? cartData.subtotal * 0.1 : 0; // 10% tax
  const shipping = cartData && cartData.subtotal > 50 ? 0 : 5.99;
  const total = cartData ? cartData.subtotal + tax + shipping : 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 md:p-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-md mb-6">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-6 md:mb-8">
                Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="px-6 md:px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  Browse Products
                </Link>
                <Link
                  href="/categories"
                  className="px-6 md:px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-md font-semibold hover:border-blue-600 hover:text-blue-600 transition"
                >
                  View Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cartData?.itemCount} items in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartData?.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 hover:shadow-md transition">
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-md overflow-hidden">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-base md:text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 transition p-1 hover:bg-red-50 rounded-md"
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {formatCurrency(item.price)} each
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-base md:text-lg font-semibold min-w-[2rem] text-center px-3">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            disabled={item.quantity >= item.stockQuantity || updatingItems.has(item.id)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-lg md:text-xl font-bold text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                        {item.stockQuantity < 10 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {item.stockQuantity} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={handleClearCart}
              disabled={clearCartMutation.isPending}
              className="text-red-600 hover:text-red-700 font-medium transition"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(cartData?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                  </span>
                </div>
                {cartData && cartData.subtotal < 50 && (
                  <p className="text-xs text-green-600">
                    Add {formatCurrency(50 - cartData.subtotal)} more for free shipping!
                  </p>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition mb-4 shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/products"
                className="w-full block text-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md font-semibold hover:border-blue-600 hover:text-blue-600 transition"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Free Shipping Over $50</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>Multiple Payment Options</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartPageContent />
    </ProtectedRoute>
  );
}

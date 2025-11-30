'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import {
  MapPin,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  Package,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
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
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface AddressFormData {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

function CheckoutPageContent() {
  const router = useRouter();
  const params = useParams();
  const storeName = params['store-name'] as string;
  
  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const queryClient = useQueryClient();
  const { customer } = useAuth();
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CREDIT' | 'ONL'>('COD');

  // Address form state
  const [shippingAddress, setShippingAddress] = useState<AddressFormData>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  });

  const [billingAddress, setBillingAddress] = useState<AddressFormData>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  });

  // Load saved address from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('customerAddress');
      if (savedAddress) {
        try {
          const address = JSON.parse(savedAddress);
          setShippingAddress({
            name: address.name || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
            phone: address.phone || customer?.phone || '',
            line1: address.line1 || '',
            line2: address.line2 || '',
            city: address.city || '',
            state: address.state || '',
            country: address.country || 'India',
            pincode: address.pincode || '',
          });
        } catch (error) {
          console.error('Failed to parse saved address:', error);
        }
      } else if (customer) {
        // Pre-fill with customer info
        setShippingAddress({
          name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          phone: customer.phone || '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
        });
      }
    }
  }, [customer]);

  // Sync billing address with shipping when checkbox is checked
  useEffect(() => {
    if (sameAsShipping) {
      setBillingAddress(shippingAddress);
    }
  }, [sameAsShipping, shippingAddress]);

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!cartData || cartData.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const orderData = {
        items: cartData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: shippingAddress.name,
          phone: shippingAddress.phone,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          pincode: shippingAddress.pincode,
        },
        billingAddress: sameAsShipping ? undefined : {
          name: billingAddress.name,
          phone: billingAddress.phone,
          line1: billingAddress.line1,
          line2: billingAddress.line2 || undefined,
          city: billingAddress.city,
          state: billingAddress.state,
          country: billingAddress.country,
          pincode: billingAddress.pincode,
        },
        paymentMethod,
      };

      const response = await api.post('/orders', orderData);
      return response.data.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed successfully!');
      router.push(getPath(`/orders/${order.id}`));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to place order. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.line1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      toast.error('Please fill in all required shipping address fields');
      return;
    }

    // Validate billing address if different
    if (!sameAsShipping) {
      if (!billingAddress.name || !billingAddress.phone || !billingAddress.line1 || 
          !billingAddress.city || !billingAddress.state || !billingAddress.pincode) {
        toast.error('Please fill in all required billing address fields');
        return;
      }
    }

    createOrderMutation.mutate();
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-8">
                Add some items to your cart before checkout.
              </p>
              <Link
                href={getPath('/products')}
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tax = cartData.subtotal * 0.1; // 10% tax
  const shipping = cartData.subtotal > 50 ? 0 : 5.99;
  const total = cartData.subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={getPath('/cart')}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.line1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street address, house number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.pincode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Billing Address</h2>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Same as shipping address</span>
                  </label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress.name}
                          onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required={!sameAsShipping}
                          value={billingAddress.phone}
                          onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required={!sameAsShipping}
                        value={billingAddress.line1}
                        onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={billingAddress.line2}
                        onChange={(e) => setBillingAddress({ ...billingAddress, line2: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress.state}
                          onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress.pincode}
                          onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={billingAddress.country}
                          onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'COD' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'COD')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when you receive your order</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'CREDIT' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CREDIT"
                      checked={paymentMethod === 'CREDIT'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'CREDIT')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">Credit</div>
                      <div className="text-sm text-gray-600">Pay on credit terms</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === 'ONL' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONL"
                      checked={paymentMethod === 'ONL'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'ONL')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="font-semibold text-gray-900">Online Payment</div>
                      <div className="text-sm text-gray-600">UPI, Net Banking, or Wallet</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cartData.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.productName}</h3>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pt-6 border-t">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(cartData.subtotal)}</span>
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
                  {cartData.subtotal < 50 && (
                    <p className="text-xs text-green-600">
                      Add {formatCurrency(50 - cartData.subtotal)} more for free shipping!
                    </p>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3 mb-6 pt-6 border-t">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Free Shipping Over ₹50</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span>30-Day Returns</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createOrderMutation.isPending ? 'Placing Order...' : `Place Order - ${formatCurrency(total)}`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}


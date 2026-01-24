'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import {
  ArrowLeft,
  CreditCard,
  Upload,
  Loader2,
  CheckCircle,
  Copy,
  X,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
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

function UPIPaymentPageContent() {
  const router = useRouter();
  const params = useParams();
  const storeName = params['store-name'] as string;
  const { tenant } = useTenant();
  const { customer } = useAuth();
  const queryClient = useQueryClient();

  // Helper to get tenant-aware path
  const getPath = (path: string) => `/${storeName}${path}`;

  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
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

  // Load saved address from localStorage
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

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    },
  });

  // Calculate totals
  const subtotal = cartData?.subtotal || 0;
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal >= 50 ? 0 : 5.99; // Free shipping over ₹50
  const total = subtotal + tax + shipping;

  // Handle screenshot upload
  const handleScreenshotUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG images are allowed');
      return;
    }

    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = response.data.data.url;
      setPaymentScreenshot(uploadedUrl);
      toast.success('Payment screenshot uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload screenshot');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!cartData || cartData.items.length === 0) {
        throw new Error('Cart is empty');
      }

      if (!paymentScreenshot) {
        throw new Error('Please upload payment screenshot');
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
        billingAddress: undefined, // Use shipping address as billing (from checkout)
        paymentMethod: 'ONL',
        paymentScreenshot,
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
      toast.error(error.response?.data?.error || error.message || 'Failed to place order. Please try again.');
    },
  });

  const handlePlaceOrder = () => {
    // Validate shipping address (should already be set from checkout, but check just in case)
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.line1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      toast.error('Shipping address is missing. Please go back to checkout and fill in your address.');
      router.push(getPath('/checkout'));
      return;
    }

    if (!paymentScreenshot) {
      toast.error('Please upload payment screenshot before placing order');
      return;
    }

    createOrderMutation.mutate();
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link
            href={getPath('/products')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!tenant?.upiId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">UPI payment is not available for this store</p>
          <Link
            href={getPath('/checkout')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={getPath('/checkout')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkout
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">UPI Payment</h1>
          <p className="text-gray-600 mt-2">Complete your payment using UPI</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* UPI Payment Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
                Payment Details
              </h2>

              {/* UPI ID */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tenant.upiId}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-gray-900 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tenant.upiId || '');
                      toast.success('UPI ID copied to clipboard!');
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {tenant.upiScannerPhoto && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan QR Code
                  </label>
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
                    <img
                      src={tenant.upiScannerPhoto}
                      alt="UPI QR Code"
                      className="w-64 h-64 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/256?text=QR+Code+Not+Found';
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) to pay
                  </p>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Copy the UPI ID or scan the QR code above</li>
                  <li>Open your UPI app and make the payment</li>
                  <li>Upload the payment screenshot below</li>
                  <li>Click "Place Order" to complete your order</li>
                </ol>
              </div>

              {/* Upload Payment Screenshot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot <span className="text-red-500">*</span>
                </label>
                {!paymentScreenshot ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleScreenshotUpload(file);
                        }
                      }}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      {uploadingScreenshot ? (
                        <>
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                          <p className="text-gray-600">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-2">Click to upload payment screenshot</p>
                          <p className="text-xs text-gray-500">JPG or PNG, max 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center gap-4">
                        <img
                          src={paymentScreenshot}
                          alt="Payment Screenshot"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-green-700 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Screenshot uploaded successfully</span>
                          </div>
                          <p className="text-sm text-gray-600">Your payment screenshot is ready</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentScreenshot('')}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Remove screenshot"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Summary - Read Only */}
            {shippingAddress.name && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">{shippingAddress.name}</p>
                  <p className="text-gray-700">{shippingAddress.phone}</p>
                  <p className="text-gray-700">{shippingAddress.line1}</p>
                  {shippingAddress.line2 && (
                    <p className="text-gray-700">{shippingAddress.line2}</p>
                  )}
                  <p className="text-gray-700">
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
                  </p>
                  <p className="text-gray-700">{shippingAddress.country}</p>
                </div>
                <Link
                  href={getPath('/checkout')}
                  className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Change address
                </Link>
              </div>
            )}
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
                          <CreditCard className="w-6 h-6 text-gray-400" />
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
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
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
                {subtotal < 50 && (
                  <p className="text-xs text-green-600">
                    Add {formatCurrency(50 - subtotal)} more for free shipping!
                  </p>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending || !paymentScreenshot}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order - ${formatCurrency(total)}`
                )}
              </button>

              {!paymentScreenshot && (
                <p className="mt-2 text-xs text-red-600 text-center">
                  Please upload payment screenshot to place order
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UPIPaymentPage() {
  return (
    <ProtectedRoute>
      <UPIPaymentPageContent />
    </ProtectedRoute>
  );
}


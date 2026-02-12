'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Package, User, MapPin, CreditCard, FileText, Truck, Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  customerNotes?: string;
  adminNotes?: string;
  paymentScreenshot?: string;
  shippingAddress?: any;
  billingAddress?: any;
  customers?: {
    users: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    creditBalance?: number | null;
  };
  order_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string;
    products: {
      id: string;
      name: string;
      thumbnail: string;
    };
  }>;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUSES = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
];

export default function OrderDetailsModal({ order, onClose, onUpdate }: OrderDetailsModalProps) {
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [internalNote, setInternalNote] = useState(order.adminNotes || '');

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.put(`/orders/${order.id}/status`, data);
    },
    onSuccess: () => {
      toast.success('Order updated successfully');
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update order');
    },
  });

  const handleUpdate = () => {
    updateMutation.mutate({
      status: orderStatus,
      paymentStatus: paymentStatus,
      trackingNumber: trackingNumber || undefined,
      internalNote: internalNote || undefined,
    });
  };

  // Credit Payment Logic
  const currentBalance = order.customers?.creditBalance || 0;
  const isCreditPayment = order.paymentMethod === 'CREDIT';
  const isPaid = order.paymentStatus === 'COMPLETED';
  const projectedBalance = currentBalance - order.total;
  // Insufficient if it's a Credit Payment, NOT yet paid, and balance would go negative
  const isInsufficient = isCreditPayment && !isPaid && projectedBalance < 0;

  const handleApproveCredit = () => {
    if (isInsufficient) return;
    updateMutation.mutate({
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED', // Explicitly mark as completed
    });
  };

  // Check if manual update should be disabled
  const isManualUpdateDisabled = 
    isCreditPayment && 
    !isPaid && 
    isInsufficient && 
    (orderStatus === 'CONFIRMED' || paymentStatus === 'COMPLETED');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-0 sm:m-4 transition-colors">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10 transition-colors">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Order Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(order.createdAt)}</p>
              </div>
              {order.shippedAt && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Shipped Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(order.shippedAt)}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivered Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(order.deliveredAt)}</p>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
              <div className="flex items-center space-x-2 mb-3">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {order.customers?.users.firstName} {order.customers?.users.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{order.customers?.users.email}</p>
                </div>
                {order.customers?.users.phone && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{order.customers.users.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Balance</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(order.customers?.creditBalance || 0)}
                  </p>
                </div>
              </div>
            </div>
            {/* Credit Payment Analysis - ONLY for Credit Orders that are NOT fully paid/completed */}
            {isCreditPayment && !isPaid && (
              <div className={`rounded-lg p-4 border transition-colors ${
                isInsufficient 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className={`w-5 h-5 ${
                    isInsufficient ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <h3 className={`font-semibold ${
                    isInsufficient ? 'text-red-900 dark:text-red-100' : 'text-blue-900 dark:text-blue-100'
                  }`}>Credit Payment Analysis</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current Wallet Balance:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(currentBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Order Total:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">-{formatCurrency(order.total)}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${
                    isInsufficient ? 'border-red-200 dark:border-red-800' : 'border-blue-200 dark:border-blue-800'
                  }`}>
                    <span className={`font-medium ${
                      isInsufficient ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'
                    }`}>Projected Balance:</span>
                    <span className={`font-bold ${
                      projectedBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>{formatCurrency(projectedBalance)}</span>
                  </div>
                </div>

                {isInsufficient && (
                  <div className="mt-3 flex items-start space-x-2 text-xs text-red-700 dark:text-red-300 bg-white/50 dark:bg-black/20 p-2 rounded">
                    <span className="font-bold">⚠️ Insufficient Funds:</span>
                    <span>Customer needs to add funds to their wallet before this order can be approved via Credit.</span>
                  </div>
                )}
              </div>
            )}

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Shipping Address</h3>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {typeof order.shippingAddress === 'object' ? (
                      <>
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.line1}</p>
                        {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                      </>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No address provided</p>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Address */}
              {order.billingAddress && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Billing Address</h3>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {typeof order.billingAddress === 'object' ? (
                      <>
                        <p>{order.billingAddress.name}</p>
                        <p>{order.billingAddress.line1}</p>
                        {order.billingAddress.line2 && <p>{order.billingAddress.line2}</p>}
                        <p>
                          {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.pincode}
                        </p>
                        <p>{order.billingAddress.country}</p>
                      </>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No address provided</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Order Items</h3>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.products.thumbnail || 'https://via.placeholder.com/40'}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.sku || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="text-green-600 dark:text-green-400">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Screenshot - Show for online payments */}
            {order.paymentMethod === 'ONL' && order.paymentScreenshot && (
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 transition-colors">
                <div className="flex items-center space-x-2 mb-3">
                  <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payment Screenshot</h3>
                </div>
                <div className="relative inline-block">
                  <img
                    src={order.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-96 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                    }}
                  />
                  <a
                    href={order.paymentScreenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition opacity-0 hover:opacity-100"
                    title="Open in new tab"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Customer uploaded payment screenshot for verification
                </p>
              </div>
            )}

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Customer Notes</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{order.customerNotes}</p>
              </div>
            )}

            {/* Update Order Status */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Update Order Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Status
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking Number
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes (not visible to customer)"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm sm:text-base"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending || isManualUpdateDisabled}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center text-sm sm:text-base font-medium shadow-sm"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Order'
                )}
              </button>

              {/* Special Approve Button for Credit Orders */}
              {isCreditPayment && !isPaid && orderStatus !== 'CONFIRMED' && orderStatus !== 'DELIVERED' && orderStatus !== 'CANCELLED' && (
                <button
                  onClick={handleApproveCredit}
                  disabled={updateMutation.isPending || isInsufficient}
                  className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center text-sm sm:text-base font-medium shadow-sm ${
                    isInsufficient 
                      ? 'bg-gray-400 dark:bg-gray-600' 
                      : 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600'
                  }`}
                >
                  {updateMutation.isPending ? (
                    'Processing...' 
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Deduct Credit
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


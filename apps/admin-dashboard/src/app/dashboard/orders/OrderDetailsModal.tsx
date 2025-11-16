'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Package, User, MapPin, CreditCard, FileText, Truck, Loader2 } from 'lucide-react';
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
  shippingAddress?: any;
  billingAddress?: any;
  customers?: {
    users: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-0 sm:m-4">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-500 mt-1">{order.orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="font-medium text-gray-900">{formatDateTime(order.createdAt)}</p>
              </div>
              {order.shippedAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Shipped Date</p>
                  <p className="font-medium text-gray-900">{formatDateTime(order.shippedAt)}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Delivered Date</p>
                  <p className="font-medium text-gray-900">{formatDateTime(order.deliveredAt)}</p>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Customer Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {order.customers?.users.firstName} {order.customers?.users.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{order.customers?.users.email}</p>
                </div>
                {order.customers?.users.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{order.customers.users.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                  </div>
                  <div className="text-sm text-gray-700">
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
                      <p className="text-gray-500">No address provided</p>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Address */}
              {order.billingAddress && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Billing Address</h3>
                  </div>
                  <div className="text-sm text-gray-700">
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
                      <p className="text-gray-500">No address provided</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Order Items</h3>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
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
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.sku || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Customer Notes</h3>
                </div>
                <p className="text-sm text-gray-700">{order.customerNotes}</p>
              </div>
            )}

            {/* Update Order Status */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Update Order Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes (not visible to customer)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center text-sm sm:text-base"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


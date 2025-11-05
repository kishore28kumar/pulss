'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Mail, Phone, MapPin, ShoppingBag, CheckCircle, Ban, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomerDetailsModalProps {
  customerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800' },
  PROCESSING: { bg: 'bg-purple-100', text: 'text-purple-800' },
  SHIPPED: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function CustomerDetailsModal({ customerId, onClose, onUpdate }: CustomerDetailsModalProps) {
  const queryClient = useQueryClient();
  const [segment, setSegment] = useState('');

  // Fetch customer details
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}`);
      setSegment(response.data.data.segment || '');
      return response.data.data;
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      return await api.patch(`/customers/${customerId}/status`, { isActive });
    },
    onSuccess: () => {
      toast.success('Customer status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  // Update segment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.put(`/customers/${customerId}`, data);
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update customer');
    },
  });

  const handleToggleStatus = () => {
    if (customer) {
      toggleStatusMutation.mutate(!customer.users.isActive);
    }
  };

  const handleUpdateSegment = () => {
    updateMutation.mutate({ segment: segment || null });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
            <div className="flex items-center space-x-4">
              {customer.users.avatar ? (
                <img
                  src={customer.users.avatar}
                  alt={`${customer.users.firstName} ${customer.users.lastName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {customer.users.firstName?.charAt(0) || 'U'}
                    {customer.users.lastName?.charAt(0) || ''}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {customer.users.firstName} {customer.users.lastName}
                </h2>
                <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Card */}
            <div className={`rounded-lg p-4 ${customer.users.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {customer.users.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Ban className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${customer.users.isActive ? 'text-green-900' : 'text-red-900'}`}>
                    {customer.users.isActive ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
                <button
                  onClick={handleToggleStatus}
                  disabled={toggleStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                    customer.users.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {toggleStatusMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : customer.users.isActive ? (
                    'Deactivate'
                  ) : (
                    'Activate'
                  )}
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{customer.users.email}</p>
                    {customer.users.emailVerified && (
                      <span className="text-xs text-green-600 flex items-center mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {customer.users.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{customer.users.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium text-gray-900">{formatDate(customer.users.createdAt)}</p>
                  </div>
                </div>
                {customer.users.lastLoginAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium text-gray-900">{formatDate(customer.users.lastLoginAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                    <h3 className="text-2xl font-bold text-blue-900 mt-1">
                      {customer._count?.orders || 0}
                    </h3>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Lifetime Value</p>
                    <h3 className="text-2xl font-bold text-green-900 mt-1">
                      {formatCurrency(customer.lifetimeValue)}
                    </h3>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Addresses</p>
                    <h3 className="text-2xl font-bold text-purple-900 mt-1">
                      {customer._count?.addresses || 0}
                    </h3>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Customer Segment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Customer Segment</h3>
              <div className="flex items-center space-x-3">
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Segment</option>
                  <option value="VIP">VIP</option>
                  <option value="REGULAR">Regular</option>
                  <option value="NEW">New</option>
                  <option value="AT_RISK">At Risk</option>
                </select>
                <button
                  onClick={handleUpdateSegment}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Addresses */}
            {customer.addresses && customer.addresses.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Addresses</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.addresses.map((address: any) => (
                    <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 uppercase">{address.type}</span>
                        {address.isDefault && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{address.name}</p>
                      <p className="text-sm text-gray-600">{address.line1}</p>
                      {address.line2 && <p className="text-sm text-gray-600">{address.line2}</p>}
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                      <p className="text-sm text-gray-600 mt-2">{address.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {customer.orders && customer.orders.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customer.orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ORDER_STATUS_COLORS[order.status]?.bg || 'bg-gray-100'
                            } ${ORDER_STATUS_COLORS[order.status]?.text || 'text-gray-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, User, Mail, Phone, MapPin, ShoppingBag, CheckCircle, Ban, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
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
  const [showAdjustBalance, setShowAdjustBalance] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('CREDIT');
  const [adjustDescription, setAdjustDescription] = useState('');

  // Fetch customer details
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}`);
      setSegment(response.data.data.segment || '');
      return response.data.data;
    },
  });

  // Fetch wallet history
  const { data: walletHistory, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['wallet-history', customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}/wallet`);
      return response.data.data;
    },
    enabled: !!customerId,
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

  // Adjust balance mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/customers/${customerId}/wallet/transaction`, data);
    },
    onSuccess: () => {
      toast.success('Wallet balance updated');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-history', customerId] });
      setShowAdjustBalance(false);
      setAdjustAmount('');
      setAdjustDescription('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update wallet');
    },
  });

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(Number(adjustAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    adjustBalanceMutation.mutate({
      amount: Number(adjustAmount),
      type: adjustType,
      description: adjustDescription || 'Manual adjustment',
    });
  };

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
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-0 sm:m-4 transition-colors">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10 transition-colors">
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {customer.users.firstName} {customer.users.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer ID: {customer.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Status Card */}
            <div className={`rounded-lg p-4 transition-colors ${customer.users.isActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {customer.users.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-medium ${customer.users.isActive ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                    {customer.users.isActive ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
                <button
                  onClick={handleToggleStatus}
                  disabled={toggleStatusMutation.isPending}
                  className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${
                    customer.users.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                      : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{customer.users.email}</p>
                    {customer.users.emailVerified && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                {customer.users.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{customer.users.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(customer.users.createdAt)}</p>
                  </div>
                </div>
                {customer.users.lastLoginAt && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(customer.users.lastLoginAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Orders</p>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {customer._count?.orders || 0}
                    </h3>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Lifetime Value</p>
                    <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {formatCurrency(customer.lifetimeValue)}
                    </h3>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Addresses</p>
                    <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {customer._count?.addresses || 0}
                    </h3>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                    {/* Using ShoppingBag as proxy for Wallet icon if Wallet not available in lucide-react v<0.lucide imports? Actually Wallet exists in lucide-react. But I need to import it. I'll stick to ShoppingBag or check imports */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Wallet & Credit</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage store credit</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(customer.creditBalance || 0)}</h3>
                </div>
              </div>

              {showAdjustBalance ? (
                <form onSubmit={handleAdjustBalance} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 transition-colors">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Adjust Balance</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                      <select
                        value={adjustType}
                        onChange={(e) => setAdjustType(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      >
                        <option value="CREDIT">Credit (Add)</option>
                        <option value="DEBIT">Debit (Deduct)</option>
                        <option value="REFUND">Refund</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <input
                        type="text"
                        value={adjustDescription}
                        onChange={(e) => setAdjustDescription(e.target.value)}
                        placeholder="Reason for adjustment..."
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAdjustBalance(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adjustBalanceMutation.isPending}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {adjustBalanceMutation.isPending ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAdjustBalance(true)}
                  className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-4"
                >
                  Adjust Balance
                </button>
              )}

              {/* Wallet History */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Recent Transactions</h4>
                {isLoadingWallet ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400 dark:text-gray-500" />
                  </div>
                ) : walletHistory && walletHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Description</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {walletHistory.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{formatDate(tx.createdAt)}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                tx.type === 'CREDIT' || tx.type === 'REFUND' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{tx.description}</td>
                            <td className={`px-3 py-2 text-right font-medium ${
                              tx.type === 'CREDIT' || tx.type === 'REFUND' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No wallet transactions yet.</p>
                )}
              </div>
            </div>

            {/* Customer Segment */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Customer Segment</h3>
              <div className="flex items-center space-x-3">
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
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
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Addresses */}
            {customer.addresses && customer.addresses.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Addresses</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.addresses.map((address: any) => (
                    <div key={address.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">{address.type}</span>
                        {address.isDefault && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{address.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{address.line1}</p>
                      {address.line2 && <p className="text-sm text-gray-600 dark:text-gray-400">{address.line2}</p>}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{address.country}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{address.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {customer.orders && customer.orders.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h3>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {customer.orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ORDER_STATUS_COLORS[order.status]?.bg || 'bg-gray-100 dark:bg-gray-700'
                            } ${ORDER_STATUS_COLORS[order.status]?.text || 'text-gray-800 dark:text-gray-200'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
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


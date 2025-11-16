'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-dashboard', period],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard', {
        params: { period },
      });
      return response.data.data;
    },
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const response = await api.get('/analytics/products', {
        params: { limit: 10 },
      });
      return response.data.data;
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Track your store performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              (dashboardStats?.revenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(dashboardStats?.revenueChange || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(dashboardStats?.revenueChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatCurrency(dashboardStats?.totalRevenue || 0)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              (dashboardStats?.ordersChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(dashboardStats?.ordersChange || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(dashboardStats?.ordersChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {dashboardStats?.totalOrders || 0}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total Orders</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {dashboardStats?.totalCustomers || 0}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total Customers</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {dashboardStats?.totalProducts || 0}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total Products</p>
        </div>
      </div>

      {/* Top Products */}
      <PermissionGuard permission={Permission.ANALYTICS_VIEW}>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          {productLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : productData?.topProducts && productData.topProducts.length > 0 ? (
            <div className="space-y-4">
              {productData.topProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No product data available</p>
          )}
        </div>
      </PermissionGuard>
    </div>
  );
}


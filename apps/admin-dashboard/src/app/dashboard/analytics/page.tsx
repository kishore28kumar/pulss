'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingBag, Users, Package, TrendingUp, TrendingDown, Search, MapPin, Building2, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';
import { getUserRole } from '@/lib/permissions';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('today');
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  // Helper function to get date range params
  const getDateParams = () => {
    if (period === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    } else if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: endOfToday.toISOString().split('T')[0],
      };
    }
    return { period };
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDateModal(true);
    } else {
      setPeriod(value);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date');
      return;
    }
    setPeriod('custom');
    setShowCustomDateModal(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };


  const dateParams = getDateParams();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-dashboard', period, dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard', {
        params: dateParams,
      });
      return response.data.data;
    },
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['analytics-products', dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/products', {
        params: { limit: 10, ...dateParams },
      });
      return response.data.data;
    },
  });

  // Global Top Searches (SUPER_ADMIN only)
  const { data: topSearchesData, isLoading: searchesLoading } = useQuery({
    queryKey: ['global-top-searches', period, dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/global-top-searches', {
        params: dateParams,
      });
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  // Top Search Locations (SUPER_ADMIN only)
  const { data: topLocationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['top-search-locations', period, dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/top-search-locations', {
        params: dateParams,
      });
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  // Tenant Performance (SUPER_ADMIN only)
  const { data: tenantPerformanceData, isLoading: tenantPerformanceLoading } = useQuery({
    queryKey: ['tenant-performance', period, dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/tenant-performance', {
        params: dateParams,
      });
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Track your store performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label htmlFor="period-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filter by:
            </label>
          </div>
          <select
            id="period-filter"
            value={period === 'custom' ? 'custom' : period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="custom">Custom Range</option>
          </select>
          {period === 'custom' && customStartDate && customEndDate && (
            <span className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {formatDateForDisplay(customStartDate)} - {formatDateForDisplay(customEndDate)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              (dashboardStats?.revenueChange || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(dashboardStats?.revenueChange || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(dashboardStats?.revenueChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(dashboardStats?.totalRevenue || 0)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              (dashboardStats?.ordersChange || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {(dashboardStats?.ordersChange || 0) >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(dashboardStats?.ordersChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dashboardStats?.totalOrders || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Orders</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dashboardStats?.totalCustomers || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Customers</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dashboardStats?.totalProducts || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Products</p>
        </div>
      </div>

      {/* Top Products */}
      <PermissionGuard permission={Permission.ANALYTICS_VIEW}>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Selling Products</h2>
          {productLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : productData?.topProducts && productData.topProducts.length > 0 ? (
            <div className="space-y-4">
              {productData.topProducts.map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">#{index + 1}</span>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.totalSold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No product data available</p>
          )}
        </div>
      </PermissionGuard>

      {/* Super Admin Only Sections */}
      {mounted && userRole === 'SUPER_ADMIN' && (
        <>
          {/* Global Top Searches */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Global Top Searches</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Most searched products across all tenants</p>
              </div>
            </div>
            {searchesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : topSearchesData?.topSearches && topSearchesData.topSearches.length > 0 ? (
              <div className="space-y-3">
                {topSearchesData.topSearches.slice(0, 10).map((search: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{search.searchTerm}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{search.uniqueUsers} unique users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{search.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">searches</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No search data available</p>
            )}
          </div>

          {/* Top Search Locations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Search Locations</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cities with most order activity</p>
              </div>
            </div>
            {locationsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : topLocationsData?.topLocations && topLocationsData.topLocations.length > 0 ? (
              <div className="space-y-3">
                {topLocationsData.topLocations.slice(0, 10).map((location: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{location.city}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{location.uniqueUsers} unique users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{location.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">orders</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No location data available</p>
            )}
          </div>

          {/* Tenant Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenant Performance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compare performance across all tenants</p>
              </div>
            </div>
            {tenantPerformanceLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : tenantPerformanceData?.tenantPerformance && tenantPerformanceData.tenantPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Tenant</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Orders</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Customers</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Products</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantPerformanceData.tenantPerformance.map((tenant: any) => (
                      <tr key={tenant.tenantId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{tenant.tenantName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{tenant.tenantSlug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(tenant.metrics.revenue.current)}</p>
                            <p className={`text-xs flex items-center justify-end ${
                              tenant.metrics.revenue.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tenant.metrics.revenue.change >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(tenant.metrics.revenue.change).toFixed(1)}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{tenant.metrics.orders.current}</p>
                            <p className={`text-xs flex items-center justify-end ${
                              tenant.metrics.orders.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tenant.metrics.orders.change >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(tenant.metrics.orders.change).toFixed(1)}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{tenant.metrics.customers.current}</p>
                            <p className={`text-xs flex items-center justify-end ${
                              tenant.metrics.customers.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tenant.metrics.customers.change >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(tenant.metrics.customers.change).toFixed(1)}%
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{tenant.metrics.products.current}</p>
                            <p className={`text-xs flex items-center justify-end ${
                              tenant.metrics.products.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {tenant.metrics.products.change >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(tenant.metrics.products.change).toFixed(1)}%
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tenant performance data available</p>
            )}
          </div>
        </>
      )}

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Custom Date Range</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select start and end dates</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || undefined}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                <p className="text-sm text-red-600 dark:text-red-400">Start date must be before end date</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowCustomDateModal(false);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCustomDate}
                disabled={!customStartDate || !customEndDate || new Date(customStartDate) > new Date(customEndDate)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect, useMemo } from 'react';
import { Package, ShoppingCart, Users, IndianRupee, TrendingUp, TrendingDown, Building2, Store, Snowflake, Sun, Search, X, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getUserRole } from '@/lib/permissions';
import { toast } from 'sonner';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customers?: {
    users: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  guestName?: string;
  guestEmail?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionPlan: string;
  email: string;
  state?: string;
  city?: string;
  createdAt: string;
  _count: {
    users: number;
    products: number;
    orders: number;
    customers: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('today');
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
      toast.error('Start date must be before end date');
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

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', period, dateParams],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard', {
        params: dateParams,
      });
      return response.data.data;
    },
  });

  // Fetch recent orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ data: Order[]; meta: any }>({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: { limit: 5, page: 1 },
      });
      return response.data.data;
    },
  });

  // Fetch low stock products (Admin only)
  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: Product[]; meta: any }>({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { limit: 100, page: 1 },
      });
      return response.data.data;
    },
    enabled: mounted && userRole !== 'SUPER_ADMIN',
  });

  // Fetch customers (Admin only)
  const { data: customersData, isLoading: customersLoading } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['recent-customers'],
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: { limit: 5, page: 1 },
      });
      return response.data.data;
    },
    enabled: mounted && userRole !== 'SUPER_ADMIN',
  });

  // Filter low stock products
  const lowStockProducts = productsData?.data?.filter(
    (product) => product.stock <= product.lowStockThreshold && product.stock > 0
  ).slice(0, 5) || [];

  // Fetch tenants summary (Super Admin only)
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get('/tenants');
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  // Calculate tenant summary stats
  const tenantStats = useMemo(() => {
    if (!tenantsData) return null;

    const total = tenantsData.length;
    const active = tenantsData.filter(t => t.status === 'ACTIVE').length;
    const frozen = tenantsData.filter(t => t.status === 'FROZEN').length;
    const trial = tenantsData.filter(t => t.status === 'TRIAL').length;
    const suspended = tenantsData.filter(t => t.status === 'SUSPENDED').length;
    const expired = tenantsData.filter(t => t.status === 'EXPIRED').length;

    // Get recent tenants (last 5, sorted by createdAt)
    const recentTenants = [...tenantsData]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Get tenants needing attention (frozen, suspended, expiring soon)
    const needsAttention = tenantsData.filter(
      t => t.status === 'FROZEN' || t.status === 'SUSPENDED' || t.status === 'EXPIRED'
    ).slice(0, 3);

    return {
      total,
      active,
      frozen,
      trial,
      suspended,
      expired,
      recentTenants,
      needsAttention,
    };
  }, [tenantsData]);

  // Format stats
  const stats = statsData
    ? [
    {
      name: 'Total Revenue',
          value: formatCurrency(statsData.totalRevenue),
          change: `${statsData.revenueChange >= 0 ? '+' : ''}${statsData.revenueChange.toFixed(1)}%`,
          trending: statsData.revenueChange >= 0 ? 'up' : 'down',
      icon: IndianRupee,
      color: 'bg-green-500',
    },
    {
      name: 'Total Orders',
          value: statsData.totalOrders.toLocaleString(),
          change: `${statsData.ordersChange >= 0 ? '+' : ''}${statsData.ordersChange.toFixed(1)}%`,
          trending: statsData.ordersChange >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'Products',
          value: statsData.totalProducts.toLocaleString(),
          change: `${statsData.productsChange >= 0 ? '+' : ''}${statsData.productsChange.toFixed(1)}%`,
          trending: statsData.productsChange >= 0 ? 'up' : 'down',
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      name: 'Customers',
          value: statsData.totalCustomers.toLocaleString(),
          change: `${statsData.customersChange >= 0 ? '+' : ''}${statsData.customersChange.toFixed(1)}%`,
          trending: statsData.customersChange >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'bg-orange-500',
    },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Overview of your store performance</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center text-sm font-medium ${
                stat.trending === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stat.trending === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders - Admin only */}
        {mounted && userRole !== 'SUPER_ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Orders</h2>
          {ordersLoading ? (
          <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 animate-pulse">
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : ordersData?.data && ordersData.data.length > 0 ? (
            <div className="space-y-4">
              {ordersData.data.map((order) => {
                const customerName = order.customers
                  ? `${order.customers.users.firstName} ${order.customers.users.lastName}`
                  : order.guestName || order.guestEmail || 'Guest';
                
                const statusColors: Record<string, string> = {
                  COMPLETED: 'bg-green-100 text-green-800',
                  PENDING: 'bg-yellow-100 text-yellow-800',
                  PROCESSING: 'bg-blue-100 text-blue-800',
                  SHIPPED: 'bg-purple-100 text-purple-800',
                  DELIVERED: 'bg-green-100 text-green-800',
                  CANCELLED: 'bg-red-100 text-red-800',
                };

                return (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customerName}</p>
                </div>
                <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                  </span>
                </div>
              </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>No orders yet</p>
          </div>
          )}
          </div>
        )}

        {/* Low Stock Products - Admin only */}
        {mounted && userRole !== 'SUPER_ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Low Stock Alert</h2>
          {productsLoading ? (
          <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 animate-pulse">
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {product.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>All products are well stocked</p>
            </div>
          )}
          </div>
        )}

        {/* Customers Overview - Admin only */}
        {mounted && userRole !== 'SUPER_ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customers Overview</h2>
              <button
                onClick={() => router.push('/dashboard/customers')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            {customersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 animate-pulse">
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : customersData?.data && customersData.data.length > 0 ? (
              <div className="space-y-4">
                {customersData.data.map((customer: any) => {
                  const customerName = customer.users
                    ? `${customer.users.firstName || ''} ${customer.users.lastName || ''}`.trim() || customer.users.email
                    : 'Unknown';
                  
                  const totalOrders = customer._count?.orders || 0;
                  const lifetimeValue = customer.lifetimeValue || 0;

                  return (
                    <div key={customer.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{customerName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{customer.users?.email || 'N/A'}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{totalOrders} orders</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(lifetimeValue)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p>No customers yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tenants Quick Overview - Super Admin Only */}
      {mounted && userRole === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenants Overview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quick summary of all tenants on the platform</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/staff')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {tenantsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : tenantStats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Tenants</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{tenantStats.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{tenantStats.active}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Frozen</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{tenantStats.frozen}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Trial</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{tenantStats.trial}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tenants */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Recent Signups
                    </h3>
                  </div>
                  {tenantStats.recentTenants.length > 0 ? (
                    <div className="space-y-3">
                      {tenantStats.recentTenants.map((tenant) => {
                        const statusColors: Record<string, string> = {
                          ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                          TRIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                          SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                          EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                          FROZEN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                        };

                        return (
                          <div
                            key={tenant.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                            onClick={() => router.push('/dashboard/staff')}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Store className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {tenant.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(tenant.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                              statusColors[tenant.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {tenant.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent tenants</p>
                  )}
                </div>

                {/* Tenants Needing Attention */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" />
                      Needs Attention
                    </h3>
                  </div>
                  {tenantStats.needsAttention.length > 0 ? (
                    <div className="space-y-3">
                      {tenantStats.needsAttention.map((tenant) => {
                        const statusColors: Record<string, string> = {
                          FROZEN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                          SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                          EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                        };

                        return (
                          <div
                            key={tenant.id}
                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition cursor-pointer border border-red-200 dark:border-red-900/30"
                            onClick={() => router.push('/dashboard/staff')}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Store className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {tenant.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">@{tenant.slug}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                              statusColors[tenant.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}>
                              {tenant.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        ✓ All tenants are in good standing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>No tenant data available</p>
            </div>
          )}
        </div>
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


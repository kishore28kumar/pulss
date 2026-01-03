'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, IndianRupee, TrendingUp, TrendingDown, Building2, Store } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getUserRole } from '@/lib/permissions';

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
  createdAt: string;
  _count: {
    users: number;
    products: number;
    orders: number;
    customers: number;
  };
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
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

  // Fetch low stock products
  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: Product[]; meta: any }>({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { limit: 100, page: 1 },
      });
      return response.data.data;
    },
  });

  // Filter low stock products
  const lowStockProducts = productsData?.data?.filter(
    (product) => product.stock <= product.lowStockThreshold && product.stock > 0
  ).slice(0, 5) || [];

  // Fetch tenants (Super Admin only)
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await api.get('/tenants');
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Overview of your store performance</p>
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
        {/* Recent Orders */}
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

        {/* Low Stock Products */}
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
      </div>

      {/* Tenants Section - Super Admin Only */}
      {mounted && userRole === 'SUPER_ADMIN' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenants</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage all tenants on the platform</p>
              </div>
            </div>
            {tenantsData && (
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tenantsData.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tenants</p>
              </div>
            )}
          </div>

          {tenantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="w-32 h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : tenantsData && tenantsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenantsData.slice(0, 6).map((tenant) => {
                const statusColors: Record<string, string> = {
                  ACTIVE: 'bg-green-100 text-green-800',
                  TRIAL: 'bg-blue-100 text-blue-800',
                  SUSPENDED: 'bg-red-100 text-red-800',
                  EXPIRED: 'bg-gray-100 text-gray-800',
                };

                return (
                  <div
                    key={tenant.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Store className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tenant.name}</h3>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[tenant.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">@{tenant.slug}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Users</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{tenant._count.users}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Products</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{tenant._count.products}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Orders</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{tenant._count.orders}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Customers</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{tenant._count.customers}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Plan: <span className="font-medium text-gray-700 dark:text-gray-300">{tenant.subscriptionPlan}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p>No tenants found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


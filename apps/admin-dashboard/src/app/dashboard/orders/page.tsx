'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Eye, 
  ShoppingBag, 
  IndianRupee, 
  Package, 
  Download
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import OrderDetailsModal from './OrderDetailsModal';
import OrderFilters from './OrderFilters';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
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
    products: {
      id: string;
      name: string;
      thumbnail: string;
    };
  }>;
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

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
  });

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', { search, page, ...filters }],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: { 
          search, 
          page, 
          limit: 10,
          ...filters,
        },
      });
      return response.data.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const response = await api.get('/orders', {
        params: { limit: 1000 }, // Get all for stats
      });
      const orders = response.data.data.data;
      
      return {
        total: orders.length,
        pending: orders.filter((o: Order) => o.status === 'PENDING').length,
        processing: orders.filter((o: Order) => o.status === 'PROCESSING' || o.status === 'CONFIRMED').length,
        completed: orders.filter((o: Order) => o.status === 'DELIVERED').length,
        revenue: orders
          .filter((o: Order) => o.paymentStatus === 'COMPLETED')
          .reduce((sum: number, o: Order) => sum + o.total, 0),
      };
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExportOrders = async () => {
    const toastId = toast.loading('Preparing orders export...');
    
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (search) params.set('search', search);

      const response = await api.get(`/orders/export?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Orders exported successfully', { id: toastId });
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export orders', { id: toastId });
    }
  };

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage and track customer orders</p>
        </div>
        <PermissionGuard permission={Permission.ORDERS_EXPORT}>
          <button 
            onClick={handleExportOrders}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Orders
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats?.total || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats?.pending || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats?.processing || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats?.completed || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(stats?.revenue || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by order number or customer email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition inline-flex items-center justify-center whitespace-nowrap text-sm sm:text-base ${
              showFilters 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <OrderFilters
            filters={filters}
            onApply={handleApplyFilters}
            onReset={() => {
              setFilters({ status: '', paymentStatus: '', startDate: '', endDate: '' });
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {order.customers?.users.firstName} {order.customers?.users.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{order.customers?.users.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ORDER_STATUS_COLORS[order.status]?.bg || 'bg-gray-100 dark:bg-gray-700'
                        } ${ORDER_STATUS_COLORS[order.status]?.text || 'text-gray-800 dark:text-gray-200'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          PAYMENT_STATUS_COLORS[order.paymentStatus]?.bg || 'bg-gray-100 dark:bg-gray-700'
                        } ${PAYMENT_STATUS_COLORS[order.paymentStatus]?.text || 'text-gray-800 dark:text-gray-200'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && (
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {search || filters.status ? 'Try adjusting your search or filters' : 'Orders will appear here once customers place them'}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
            refetch();
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}


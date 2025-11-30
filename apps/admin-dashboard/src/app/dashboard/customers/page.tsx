'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  ShoppingBag,
  IndianRupee,
  Eye,
  CheckCircle,
  Mail,
  Phone
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getUserRole } from '@/lib/permissions';
import CustomerDetailsModal from './CustomerDetailsModal';

interface Customer {
  id: string;
  userId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  segment?: string;
  lifetimeValue: number;
  totalOrders: number;
  createdAt: string;
  users: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    emailVerified: boolean;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
  };
  _count?: {
    orders: number;
    addresses: number;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setMounted(true);
    const role = getUserRole();
    setUserRole(role);
    
    // Redirect if user is not SUPER_ADMIN
    if (role && role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [router]);

  // Fetch customers (only for SUPER_ADMIN)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: { search, page, limit: 15 },
      });
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  // Fetch stats (only for SUPER_ADMIN)
  const { data: stats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const response = await api.get('/customers/stats');
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  const customers = data?.data || [];
  const meta = data?.meta;

  // Don't render if not SUPER_ADMIN
  if (!mounted || userRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your customer base</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.totalCustomers || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.activeCustomers || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.inactiveCustomers || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.totalOrders || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats?.totalRevenue || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading customers...</p>
          </div>
        ) : customers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {customer.users.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={customer.users.avatar}
                                alt={`${customer.users.firstName} ${customer.users.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {customer.users.firstName?.charAt(0) || 'U'}
                                  {customer.users.lastName?.charAt(0) || ''}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.users.firstName} {customer.users.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              {customer.users.emailVerified ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : null}
                              {customer.users.emailVerified ? 'Verified' : 'Not verified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.users.email}
                        </div>
                        {customer.users.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            {customer.users.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.users.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.users.lastLoginAt ? formatDate(customer.users.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer._count?.orders || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(customer.lifetimeValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.users.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.users.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
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
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500">
              {search ? 'Try adjusting your search' : 'Customers will appear here once they register'}
            </p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customerId={selectedCustomer.id}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={() => {
            refetch();
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}


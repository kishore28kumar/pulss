'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye, Upload, Store } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission, getUserRole, isSuperAdmin } from '@/lib/permissions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenants?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  const isSuperAdminUser = mounted && isSuperAdmin();

  // Fetch admins list for SUPER_ADMIN
  const { data: adminsData } = useQuery<{ data: Admin[] }>({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await api.get('/staff');
      return response.data.data;
    },
    enabled: isSuperAdminUser,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, page, tenantId: selectedTenantId }],
    queryFn: async () => {
      const params: any = { search, page, limit: 10 };
      const config: any = {};
      
      // For SUPER_ADMIN, include tenantId if selected
      if (isSuperAdminUser && selectedTenantId) {
        params.tenantId = selectedTenantId;
        // Get tenant slug from selected admin for header
        const selectedAdmin = adminsData?.data?.find(admin => admin.tenants?.id === selectedTenantId);
        if (selectedAdmin?.tenants?.slug) {
          config.headers = { 'X-Tenant-Slug': selectedAdmin.tenants.slug };
        }
      }
      
      const response = await api.get('/products', { ...config, params });
      return response.data.data;
    },
    enabled: !isSuperAdminUser || !!selectedTenantId, // SUPER_ADMIN must select a tenant
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    },
  });

  const handleDelete = (product: any) => {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleView = (product: any) => {
    // Navigate to product detail page or open in new tab
    router.push(`/dashboard/products/${product.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            {isSuperAdminUser ? 'Manage products on behalf of admins' : 'Manage your product inventory'}
          </p>
        </div>
        {!isSuperAdminUser && (
        <PermissionGuard permission={Permission.PRODUCTS_CREATE}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/products/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Link>
            <Link
              href="/dashboard/products/bulk-import"
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm sm:text-base"
            >
              <Upload className="w-5 h-5 mr-2" />
              Import Products
            </Link>
          </div>
        </PermissionGuard>
        )}
        {isSuperAdminUser && selectedTenantId && (
          <PermissionGuard permission={Permission.PRODUCTS_CREATE}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Link
                href={`/dashboard/products/new?tenantId=${selectedTenantId}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product on Behalf of Admin
              </Link>
            </div>
          </PermissionGuard>
        )}
      </div>

      {/* Tenant Selector for SUPER_ADMIN */}
      {isSuperAdminUser && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label htmlFor="tenant-select" className="block text-sm font-medium text-gray-700 mb-2">
            <Store className="w-4 h-4 inline mr-2" />
            Select Admin/Store
          </label>
          <select
            id="tenant-select"
            value={selectedTenantId || ''}
            onChange={(e) => {
              setSelectedTenantId(e.target.value || null);
              setPage(1); // Reset to first page when tenant changes
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">-- Select an Admin/Store --</option>
            {adminsData?.data?.map((admin) => (
              <option key={admin.id} value={admin.tenants?.id || ''}>
                {admin.firstName} {admin.lastName} ({admin.tenants?.name || 'No Store'})
              </option>
            ))}
          </select>
          {!selectedTenantId && (
            <p className="mt-2 text-sm text-gray-500">
              Please select an admin/store to view and manage their products.
            </p>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base whitespace-nowrap">
            Filters
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isSuperAdminUser && !selectedTenantId ? (
          <div className="p-12 text-center">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select an admin/store to view products.</p>
          </div>
        ) : isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No products found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      SKU
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.data?.map((product: any) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={product.thumbnail || 'https://via.placeholder.com/40'}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">{product.categories?.[0]?.category?.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              SKU: {product.sku || 'N/A'}
                            </div>
                            <div className="sm:hidden mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                product.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {product.sku || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          product.stock > product.lowStockThreshold
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(Number(product.price))}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <PermissionGuard permission={Permission.PRODUCTS_UPDATE}>
                            <Link
                              href={`/dashboard/products/${product.id}/edit`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          </PermissionGuard>
                          <PermissionGuard permission={Permission.PRODUCTS_DELETE}>
                            <button
                              onClick={() => handleDelete(product)}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing {data?.meta?.page * data?.meta?.limit - data?.meta?.limit + 1} to{' '}
                {Math.min(data?.meta?.page * data?.meta?.limit, data?.meta?.total)} of{' '}
                {data?.meta?.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (data?.meta?.totalPages || 1)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


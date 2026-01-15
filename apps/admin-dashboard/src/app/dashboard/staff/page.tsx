'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit, Trash2, UserPlus, Mail, Phone, CheckCircle, XCircle, ExternalLink, Store, Download, X, LayoutDashboard, Snowflake, Unlock, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';
import { getUserRole } from '@/lib/permissions';
import { authService } from '@/lib/auth';
import EditStaffModal from './EditStaffModal';
import EditTenantModal from './EditTenantModal';
import ResetPasswordModal from './ResetPasswordModal';
import StaffActionsPopover from './StaffActionsPopover';
import { useRouter } from 'next/navigation';
import { getStorefrontUrl } from '@/lib/config/urls';

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenantId?: string;
  tenants?: {
    id: string;
    name: string;
    slug: string;
    state?: string;
    city?: string;
  };
}

export default function StaffPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [page, setPage] = useState(1);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingTenant, setEditingTenant] = useState<{ id: string; name: string; staffMember: StaffMember } | null>(null);
  const [freezingStaff, setFreezingStaff] = useState<StaffMember | null>(null);
  const [unfreezingStaff, setUnfreezingStaff] = useState<StaffMember | null>(null);
  const [resettingPassword, setResettingPassword] = useState<StaffMember | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
    
    // Get tenant slug from logged-in user
    const currentUser = authService.getStoredUser();
    if (currentUser?.tenant?.slug) {
      setTenantSlug(currentUser.tenant.slug);
    }
  }, []);

  // Fetch all staff to get unique states/cities (for SUPER_ADMIN only)
  const { data: allStaffData } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: async () => {
      const response = await api.get('/staff', {
        params: { page: 1, limit: 1000 },
      });
      return response.data.data;
    },
    enabled: mounted && userRole === 'SUPER_ADMIN',
  });

  // Get unique states and cities from staff tenants
  const uniqueStates = Array.from(
    new Set(
      allStaffData?.data
        ?.map((member: StaffMember) => member.tenants?.state)
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const uniqueCities = Array.from(
    new Set(
      allStaffData?.data
        ?.filter((member: StaffMember) => {
          if (!selectedState) return true;
          return member.tenants?.state === selectedState;
        })
        .map((member: StaffMember) => member.tenants?.city)
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const { data, isLoading } = useQuery({
    queryKey: ['staff', { search, page, state: selectedState, city: selectedCity }],
    queryFn: async () => {
      const params: any = { search, page, limit: 15 };
      if (mounted && userRole === 'SUPER_ADMIN') {
        if (selectedState) params.state = selectedState;
        if (selectedCity) params.city = selectedCity;
      }
      const response = await api.get('/staff', { params });
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove staff member');
    },
  });

  const freezeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.patch(`/staff/${id}/freeze`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Account frozen successfully');
      setFreezingStaff(null);
      setFreezeReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to freeze account');
    },
  });

  const unfreezeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/staff/${id}/unfreeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Account unfrozen successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unfreeze account');
    },
  });

  const staff = data?.data || [];
  const meta = data?.meta;

  const handleDelete = (member: StaffMember) => {
    setOpenPopoverId(null); // Close popover when opening delete confirmation
    if (confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName}?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setOpenPopoverId(null); // Close popover when opening edit modal
  };

  const handleFreeze = (member: StaffMember) => {
    setFreezingStaff(member);
    setFreezeReason('');
    setOpenPopoverId(null); // Close popover when opening freeze modal
  };

  const handleConfirmFreeze = () => {
    if (!freezingStaff) return;
    if (!freezeReason.trim()) {
      toast.error('Please provide a reason for freezing the account');
      return;
    }
    freezeMutation.mutate({ id: freezingStaff.id, reason: freezeReason.trim() });
  };

  const handleUnfreeze = (member: StaffMember) => {
    setUnfreezingStaff(member);
    setOpenPopoverId(null); // Close popover when opening unfreeze modal
  };

  const handleConfirmUnfreeze = () => {
    if (!unfreezingStaff) return;
    unfreezeMutation.mutate(unfreezingStaff.id);
    setUnfreezingStaff(null);
  };

  const handleDownloadCustomers = async (tenantId: string, tenantName: string) => {
    try {
      toast.loading('Preparing customer data export...', { id: 'export-customers' });
      
      const response = await api.get(`/customers/export/${tenantId}`, {
        responseType: 'blob', // Important for file download
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `customers_${tenantName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Customer data exported successfully', { id: 'export-customers' });
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export customer data', { id: 'export-customers' });
    }
  };

  const handleGenerateDashboardLink = async (adminId: string) => {
    try {
      toast.loading('Generating login link...', { id: 'dashboard-link' });

      const response = await api.get(`/auth/login-token/${adminId}`);
      const { loginUrl } = response.data.data;

      // Open in new tab
      window.open(loginUrl, '_blank');

      toast.success('Opening admin dashboard...', { id: 'dashboard-link' });
    } catch (error: any) {
      console.error('Dashboard link error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate login link', { id: 'dashboard-link' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {mounted && userRole === 'SUPER_ADMIN' ? 'Tenants Management' : 'Staff Management'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {mounted && userRole === 'SUPER_ADMIN' 
              ? 'Manage tenant admin users' 
              : 'Manage your team members'}
          </p>
        </div>
        <PermissionGuard permission={Permission.STAFF_INVITE}>
          <button
            onClick={() => router.push('/dashboard/staff/new')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {mounted && userRole === 'SUPER_ADMIN' ? 'Create Tenant' : 'Add Staff'}
          </button>
        </PermissionGuard>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={mounted && userRole === 'SUPER_ADMIN' 
                ? 'Search by name, email, or store name...' 
                : 'Search by name or email...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* State/City Filters - SUPER_ADMIN only */}
          {mounted && userRole === 'SUPER_ADMIN' && (
            <>
              <div className="sm:w-48">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="">All States</option>
                  {uniqueStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setPage(1);
                  }}
                  disabled={!selectedState}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              {(selectedState || selectedCity) && (
                <button
                  onClick={() => {
                    setSelectedState('');
                    setSelectedCity('');
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading staff...</p>
          </div>
        ) : staff.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {mounted && userRole === 'SUPER_ADMIN' ? 'Tenant' : 'Staff Member'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    {mounted && userRole === 'SUPER_ADMIN' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Store
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {staff.map((member: StaffMember) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {member.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={member.avatar}
                                alt={`${member.firstName} ${member.lastName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {member.firstName?.charAt(0) || 'S'}
                                  {member.lastName?.charAt(0) || ''}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              {member.emailVerified ? (
                                <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-gray-400 dark:text-gray-500 mr-1" />
                              )}
                              {member.emailVerified ? 'Verified' : 'Not verified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                            {member.phone}
                          </div>
                        )}
                      </td>
                      {mounted && userRole === 'SUPER_ADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {member.tenants ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.tenants.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">@{member.tenants.slug}</div>
                              {(member.tenants.city || member.tenants.state) && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {[member.tenants.city, member.tenants.state].filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {member.isActive ? 'Active' : 'Frozen'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Dashboard Link - SUPER_ADMIN only */}
                          {mounted && userRole === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleGenerateDashboardLink(member.id)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                              title={`Login as ${member.firstName} ${member.lastName}`}
                            >
                              <LayoutDashboard className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Dashboard</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          )}
                          {/* Store Link */}
                          {(() => {
                            // For SUPER_ADMIN viewing admins, use the admin's tenant
                            // For others, use the logged-in user's tenant
                            const memberTenantSlug = mounted && userRole === 'SUPER_ADMIN' && member.tenants?.slug
                              ? member.tenants.slug
                              : tenantSlug;
                            
                            const memberStorefrontUrl = memberTenantSlug
                              ? (() => {
                                  const baseUrl = typeof window !== 'undefined' 
                                    ? getStorefrontUrl()
                                    : (process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000');
                                  return `${baseUrl}/${memberTenantSlug}`;
                                })()
                              : null;
                            
                            return memberStorefrontUrl ? (
                              <a
                                href={memberStorefrontUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                                title={`View ${member.tenants?.name || 'Store'} Storefront`}
                              >
                                <Store className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Store</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            ) : null;
                          })()}
                          {/* Actions Popover */}
                          <StaffActionsPopover
                            member={member}
                            userRole={userRole}
                            mounted={mounted}
                            isOpen={openPopoverId === member.id}
                            onToggle={(memberId) => setOpenPopoverId(memberId)}
                            onEditStaff={() => handleEdit(member)}
                            onEditTenant={() => {
                              if (member.tenants?.id) {
                                setEditingTenant({ 
                                  id: member.tenants.id, 
                                  name: member.tenants.name,
                                  staffMember: member
                                });
                                setOpenPopoverId(null); // Close popover when opening tenant edit modal
                              }
                            }}
                            onEditStaff={() => {
                              // For SUPER_ADMIN with tenant, use Edit Tenant instead
                              if (mounted && userRole === 'SUPER_ADMIN' && member.tenants?.id) {
                                setEditingTenant({ 
                                  id: member.tenants.id, 
                                  name: member.tenants.name,
                                  staffMember: member
                                });
                                setOpenPopoverId(null);
                              } else {
                                handleEdit(member);
                              }
                            }}
                            onFreeze={() => handleFreeze(member)}
                            onUnfreeze={() => handleUnfreeze(member)}
                            onDownloadCustomers={() => {
                              if (member.tenants?.id) {
                                handleDownloadCustomers(member.tenants.id, member.tenants.name);
                              }
                            }}
                            onResetPassword={() => {
                              setResettingPassword(member);
                              setOpenPopoverId(null);
                            }}
                            onDelete={() => handleDelete(member)}
                            isUnfreezePending={unfreezeMutation.isPending}
                            isDeletePending={deleteMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && (
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <UserPlus className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {mounted && userRole === 'SUPER_ADMIN' ? 'No tenant admins found' : 'No staff members found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search 
                ? 'Try adjusting your search' 
                : mounted && userRole === 'SUPER_ADMIN'
                  ? 'Get started by creating your first tenant admin'
                  : 'Get started by inviting your first staff member'}
            </p>
            {!search && (
              <PermissionGuard permission={Permission.STAFF_INVITE}>
                <button
                  onClick={() => router.push('/dashboard/staff/new')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {mounted && userRole === 'SUPER_ADMIN' ? 'Create Tenant' : 'Add Staff'}
                </button>
              </PermissionGuard>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <EditStaffModal
          staffMember={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={() => {
            setEditingStaff(null);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
          }}
        />
      )}

      {/* Freeze Modal */}
      {freezingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Freeze Account
              </h2>
              <button
                onClick={() => {
                  setFreezingStaff(null);
                  setFreezeReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to freeze{' '}
                <span className="font-semibold">
                  {freezingStaff.firstName} {freezingStaff.lastName}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                This will prevent them from logging in and accessing their storefront.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="Enter reason for freezing this account..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setFreezingStaff(null);
                  setFreezeReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFreeze}
                disabled={freezeMutation.isPending || !freezeReason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {freezeMutation.isPending ? 'Freezing...' : 'Freeze Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unfreeze Modal */}
      {unfreezingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 mx-auto">
              <Unlock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Unfreeze Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to unfreeze{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {unfreezingStaff.firstName} {unfreezingStaff.lastName}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                This will restore their access to the admin dashboard and storefront.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setUnfreezingStaff(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnfreeze}
                disabled={unfreezeMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unfreezeMutation.isPending ? 'Unfreezing...' : 'Unfreeze Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <EditTenantModal
          tenantId={editingTenant.id}
          tenantName={editingTenant.name}
          staffMember={editingTenant.staffMember}
          onClose={() => setEditingTenant(null)}
          onSuccess={() => {
            setEditingTenant(null);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resettingPassword && (
        <ResetPasswordModal
          staffMember={resettingPassword}
          onClose={() => setResettingPassword(null)}
          onSuccess={() => {
            setResettingPassword(null);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
          }}
        />
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, UserPlus, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';
import { getUserRole } from '@/lib/permissions';
import InviteStaffModal from './InviteStaffModal';
import EditStaffModal from './EditStaffModal';

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
}

export default function StaffPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRole());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', { search, page }],
    queryFn: async () => {
      const response = await api.get('/staff', {
        params: { search, page, limit: 15 },
      });
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

  const staff = data?.data || [];
  const meta = data?.meta;

  const handleDelete = (member: StaffMember) => {
    if (confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName}?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mounted && userRole === 'SUPER_ADMIN' ? 'Admin Management' : 'Staff Management'}
          </h1>
          <p className="text-gray-500 mt-1">
            {mounted && userRole === 'SUPER_ADMIN' 
              ? 'Manage admin users for this tenant' 
              : 'Manage your team members'}
          </p>
        </div>
        <PermissionGuard permission={Permission.STAFF_INVITE}>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {mounted && userRole === 'SUPER_ADMIN' ? 'Create Admin' : 'Add Staff'}
          </button>
        </PermissionGuard>
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

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading staff...</p>
          </div>
        ) : staff.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((member: StaffMember) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
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
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              {member.emailVerified ? (
                                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 text-gray-400 mr-1" />
                              )}
                              {member.emailVerified ? 'Verified' : 'Not verified'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            {member.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <PermissionGuard permission={Permission.STAFF_UPDATE}>
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition"
                              title="Edit Staff Member"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission={Permission.STAFF_DELETE}>
                            <button
                              onClick={() => handleDelete(member)}
                              className="p-2 text-gray-400 hover:text-red-600 transition"
                              disabled={deleteMutation.isPending}
                              title="Delete Staff Member"
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
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {mounted && userRole === 'SUPER_ADMIN' ? 'No admin users found' : 'No staff members found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search 
                ? 'Try adjusting your search' 
                : mounted && userRole === 'SUPER_ADMIN'
                  ? 'Get started by creating your first admin user'
                  : 'Get started by inviting your first staff member'}
            </p>
            {!search && (
              <PermissionGuard permission={Permission.STAFF_INVITE}>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {mounted && userRole === 'SUPER_ADMIN' ? 'Create Admin' : 'Add Staff'}
                </button>
              </PermissionGuard>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteStaffModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
          }}
        />
      )}

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
    </div>
  );
}



'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, AlertCircle, Eye } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Permission, isSuperAdmin } from '@/lib/permissions';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import Link from 'next/link';

interface AdRequest {
    id: string;
    title: string;
    description: string;
    images: string[];
    links: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
    adminNote?: string;
    startDate?: string;
    endDate?: string;
    isActive: boolean;
    createdAt: string;
    tenants?: {
        name: string;
        slug: string;
    };
}

export default function AdsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [mounted, setMounted] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
    const [targetStatus, setTargetStatus] = useState<string>('');
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const isSuperAdminUser = mounted && isSuperAdmin();

    // Fetch Ad Requests
    const { data, isLoading } = useQuery({
        queryKey: ['ads', { page, status: statusFilter }],
        queryFn: async () => {
            const params: any = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/ads', { params });
            return response.data;
        },
    });

    const requests = data?.data || [];
    const meta = data?.meta;

    // Approve/Reject Mutation (Super Admin)
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, adminNote }: { id: string, status: string, adminNote?: string }) => {
            await api.patch(`/ads/${id}/status`, { status, adminNote });
        },
        onSuccess: () => {
            toast.success('Ad status updated successfully');
            queryClient.invalidateQueries({ queryKey: ['ads'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });

    const handleStatusUpdate = (id: string, status: string) => {
        setSelectedAdId(id);
        setTargetStatus(status);
        setAdminNote('');
        setIsModalOpen(true);
    };

    const confirmStatusUpdate = () => {
        if (selectedAdId && targetStatus) {
            updateStatusMutation.mutate({
                id: selectedAdId,
                status: targetStatus,
                adminNote: adminNote
            });
            setIsModalOpen(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'REVOKED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ad Permissions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isSuperAdminUser
                            ? 'Manage ad placement requests from shops'
                            : 'Request ad placements for your shop storefront'}
                    </p>
                </div>

                {!isSuperAdminUser && (
                    <PermissionGuard permission={Permission.ADS_CREATE}>
                        <Link
                            href="/dashboard/ads/new"
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Request
                        </Link>
                    </PermissionGuard>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="REVOKED">Revoked</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        No ad requests found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                                    {isSuperAdminUser && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Store</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {requests.map((req: AdRequest) => (
                                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {req.images?.[0] && (
                                                    <img src={req.images[0]} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{req.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {isSuperAdminUser && (
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {req.tenants?.name || 'N/A'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Link href={`/dashboard/ads/${req.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition inline-block">
                                                <Eye className="w-4 h-4" />
                                            </Link>

                                            {/* Super Admin Actions */}
                                            {isSuperAdminUser && req.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {isSuperAdminUser && req.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(req.id, 'REVOKED')}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                                                    title="Revoke"
                                                >
                                                    <AlertCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {meta && meta.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {meta.pages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                            disabled={page === meta.pages}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Status Update Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-full ${targetStatus === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                    targetStatus === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {targetStatus === 'APPROVED' ? <Check className="w-5 h-5" /> :
                                        targetStatus === 'REJECTED' ? <X className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                    {targetStatus === 'APPROVED' ? 'Approve' :
                                        targetStatus === 'REJECTED' ? 'Reject' : 'Revoke'} Request
                                </h3>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                                You are about to <span className="font-semibold text-gray-900 dark:text-gray-200">{targetStatus.toLowerCase()}</span> this ad request.
                                This action will be visible to the shop admin.
                            </p>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Admin Note (Optional)
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder={`e.g. ${targetStatus === 'APPROVED' ? 'Looks great! Approved for launch.' : 'Image quality is too low.'}`}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none h-28"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex gap-3 justify-end items-center">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusUpdate}
                                disabled={updateStatusMutation.isPending}
                                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition transform active:scale-95 disabled:opacity-50 ${targetStatus === 'APPROVED' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
                                    targetStatus === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                                        'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'
                                    }`}
                            >
                                {updateStatusMutation.isPending ? 'Updating...' : `Confirm ${targetStatus.charAt(0) + targetStatus.slice(1).toLowerCase()}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

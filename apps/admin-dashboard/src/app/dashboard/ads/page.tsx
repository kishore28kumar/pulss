
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, AlertCircle, Eye, Image as ImageIcon } from 'lucide-react';
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
    requestType?: 'AD_PLACEMENT' | 'HERO_IMAGES_CHANGE' | 'HERO_IMAGES_REMOVE' | 'HERO_IMAGES_REORDER' | 'HERO_IMAGES_ADD';
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
    
    // Hero Image Request Modal State
    const [isHeroImageModalOpen, setIsHeroImageModalOpen] = useState(false);
    const [heroImageRequestType, setHeroImageRequestType] = useState<string>('HERO_IMAGES_CHANGE');
    const [heroImageDescription, setHeroImageDescription] = useState<string>('');
    const [heroImageUrls, setHeroImageUrls] = useState<string[]>(['']);
    const [isSubmittingHeroRequest, setIsSubmittingHeroRequest] = useState(false);

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

    const getRequestTypeLabel = (requestType?: string) => {
        switch (requestType) {
            case 'HERO_IMAGES_CHANGE': return 'Change Hero Images';
            case 'HERO_IMAGES_REMOVE': return 'Remove Hero Images';
            case 'HERO_IMAGES_REORDER': return 'Reorder Hero Images';
            case 'HERO_IMAGES_ADD': return 'Add Hero Images';
            case 'AD_PLACEMENT': return 'Ad Placement';
            default: return 'Ad Placement';
        }
    };

    const handleHeroImageRequestSubmit = async () => {
        if (!heroImageDescription.trim()) {
            toast.error('Please provide a description/reason for your request');
            return;
        }

        const validUrls = heroImageUrls.filter(url => url.trim() !== '');
        
        if (heroImageRequestType !== 'HERO_IMAGES_REMOVE' && validUrls.length === 0) {
            toast.error('Please provide at least one image URL');
            return;
        }

        if (validUrls.length > 10) {
            toast.error('Maximum 10 hero images allowed');
            return;
        }

        setIsSubmittingHeroRequest(true);
        try {
            await api.post('/ads', {
                title: getRequestTypeLabel(heroImageRequestType),
                description: heroImageDescription,
                images: validUrls,
                links: [],
                requestType: heroImageRequestType,
            });

            toast.success('Hero image request submitted successfully');
            setIsHeroImageModalOpen(false);
            setHeroImageRequestType('HERO_IMAGES_CHANGE');
            setHeroImageDescription('');
            setHeroImageUrls(['']);
            queryClient.invalidateQueries({ queryKey: ['ads'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmittingHeroRequest(false);
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
                        <div className="flex gap-3">
                            <Link
                                href="/dashboard/ads/new"
                                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Ad Request
                            </Link>
                            <button
                                onClick={() => setIsHeroImageModalOpen(true)}
                                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                <ImageIcon className="w-5 h-5 mr-2" />
                                Hero Image Request
                            </button>
                        </div>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
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
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                {getRequestTypeLabel(req.requestType)}
                                            </span>
                                        </td>
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

            {/* Hero Image Request Modal */}
            {isHeroImageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        Request Hero Image Changes
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsHeroImageModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Request Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Request Type *
                                    </label>
                                    <select
                                        value={heroImageRequestType}
                                        onChange={(e) => {
                                            setHeroImageRequestType(e.target.value);
                                            if (e.target.value === 'HERO_IMAGES_REMOVE') {
                                                setHeroImageUrls(['']);
                                            } else if (heroImageUrls.length === 0 || heroImageUrls[0] === '') {
                                                setHeroImageUrls(['']);
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="HERO_IMAGES_CHANGE">Change Hero Images</option>
                                        <option value="HERO_IMAGES_ADD">Add Hero Images</option>
                                        <option value="HERO_IMAGES_REMOVE">Remove Hero Images</option>
                                        <option value="HERO_IMAGES_REORDER">Reorder Hero Images</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description/Reason *
                                    </label>
                                    <textarea
                                        value={heroImageDescription}
                                        onChange={(e) => setHeroImageDescription(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                        placeholder="Please describe what changes you want to make to the hero images..."
                                    />
                                </div>

                                {/* Image URLs */}
                                {heroImageRequestType !== 'HERO_IMAGES_REMOVE' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Image URLs * (Max 10)
                                        </label>
                                        <div className="space-y-2">
                                            {heroImageUrls.map((url, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={url}
                                                        onChange={(e) => {
                                                            const updated = [...heroImageUrls];
                                                            updated[index] = e.target.value;
                                                            setHeroImageUrls(updated);
                                                        }}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                        placeholder={`Image URL ${index + 1}`}
                                                    />
                                                    {heroImageUrls.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = heroImageUrls.filter((_, i) => i !== index);
                                                                setHeroImageUrls(updated.length > 0 ? updated : ['']);
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {heroImageUrls.length < 10 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setHeroImageUrls([...heroImageUrls, ''])}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition"
                                                >
                                                    <Plus className="w-4 h-4 inline mr-2" />
                                                    Add Another URL
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            {heroImageUrls.filter(url => url.trim() !== '').length} / 10 images
                                        </p>
                                    </div>
                                )}

                                {heroImageRequestType === 'HERO_IMAGES_REMOVE' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Image URLs to Remove *
                                        </label>
                                        <div className="space-y-2">
                                            {heroImageUrls.map((url, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={url}
                                                        onChange={(e) => {
                                                            const updated = [...heroImageUrls];
                                                            updated[index] = e.target.value;
                                                            setHeroImageUrls(updated);
                                                        }}
                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                                                        placeholder={`Image URL to remove ${index + 1}`}
                                                    />
                                                    {heroImageUrls.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = heroImageUrls.filter((_, i) => i !== index);
                                                                setHeroImageUrls(updated.length > 0 ? updated : ['']);
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setHeroImageUrls([...heroImageUrls, ''])}
                                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition"
                                            >
                                                <Plus className="w-4 h-4 inline mr-2" />
                                                Add Another URL
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex gap-3 justify-end items-center border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsHeroImageModalOpen(false);
                                    setHeroImageRequestType('HERO_IMAGES_CHANGE');
                                    setHeroImageDescription('');
                                    setHeroImageUrls(['']);
                                }}
                                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleHeroImageRequestSubmit}
                                disabled={isSubmittingHeroRequest}
                                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition transform active:scale-95 disabled:opacity-50"
                            >
                                {isSubmittingHeroRequest ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

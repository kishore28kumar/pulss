
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { isSuperAdmin } from '@/lib/permissions';

export default function AdDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data, isLoading } = useQuery({
        queryKey: ['ad', id],
        queryFn: async () => {
            const response = await api.get(`/ads/${id}`);
            return response.data.data;
        }
    });

    const getStatusBadge = (status: string) => {
        const colors: any = {
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            REVOKED: 'bg-gray-100 text-gray-800',
            PENDING: 'bg-yellow-100 text-yellow-800'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    if (isLoading) return <div>Loading...</div>;
    if (!data) return <div>Ad not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/ads" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Ad Request Details</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4">Ad Content</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500 block">Title</label>
                                <p className="font-medium text-lg">{data.title}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block">Description</label>
                                <p className="text-gray-700 dark:text-gray-300">{data.description}</p>
                            </div>

                            <div className="pt-4">
                                <label className="text-sm text-gray-500 block mb-2">Images & Links</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.images?.map((img: string, idx: number) => (
                                        <div key={idx} className="border rounded-lg overflow-hidden">
                                            <img src={img} alt={`Ad ${idx + 1}`} className="w-full h-48 object-cover" />
                                            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 text-xs truncate">
                                                {data.links?.[idx] ? (
                                                    <a href={data.links[idx]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        {data.links[idx]}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">No link provided</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4">Request Info</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Status</span>
                                {getStatusBadge(data.status)}
                            </div>

                            {data.tenants && (
                                <div>
                                    <span className="text-sm text-gray-500 block">Requested By</span>
                                    <span className="font-medium">{data.tenants.name}</span>
                                </div>
                            )}

                            <div>
                                <span className="text-sm text-gray-500 block">Created At</span>
                                <span>{new Date(data.createdAt).toLocaleString()}</span>
                            </div>

                            {data.adminNote && (
                                <div className="pt-4 border-t dark:border-gray-700">
                                    <span className="text-sm text-gray-500 block">Admin Note</span>
                                    <p className="text-sm italic text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded mt-1">
                                        "{data.adminNote}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

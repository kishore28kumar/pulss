
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, X, Maximize2, Calendar, Store, Tag, Info } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['ad', id],
        queryFn: async () => {
            const response = await api.get(`/ads/${id}`);
            return response.data.data;
        }
    });

    const getStatusBadge = (status: string) => {
        const colors: any = {
            APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
            REVOKED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!data) return (
        <div className="max-w-4xl mx-auto py-20 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ad Request Not Found</h2>
            <Link href="/dashboard/ads" className="mt-4 text-blue-600 hover:underline inline-block">Return to list</Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 py-6 transition-all duration-300">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/ads" className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Ad Request Details</h1>
                        <p className="text-sm text-gray-500 font-medium">Review and manage store advertisement requests</p>
                    </div>
                </div>
                <div>
                    {getStatusBadge(data.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content - Ad Details */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                            <Tag className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Campaign Content</h2>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Campaign Title</label>
                                    <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{data.title}</p>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Campaign Description</label>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg italic">
                                        {data.description || <span className="text-gray-400">No description provided for this ad campaign.</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-6">Asset Gallery & Redirection</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {data.images?.map((img: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="group relative cursor-pointer border-2 border-gray-100 dark:border-gray-700/50 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col"
                                            onClick={() => setSelectedImage(img)}
                                        >
                                            <div className="aspect-square relative overflow-hidden">
                                                <img
                                                    src={img}
                                                    alt={`Ad Asset ${idx + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                                                        <Maximize2 className="text-white w-6 h-6 shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white dark:bg-gray-800/50 flex-1">
                                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1 block">Redirects to</span>
                                                <div className="truncate text-sm text-gray-900 dark:text-gray-100 font-bold group-hover:text-blue-600 transition-colors">
                                                    {data.links?.[idx] || 'General Inventory'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-start gap-2 mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <p className="text-[11px] text-gray-500 leading-normal">
                                        Each asset above displays its correlated search term. On the storefront, clicking these images will pre-filter the products page using these exact terms. <span className="font-bold text-gray-700 dark:text-gray-300">Click any image to verify scale.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Request Summary */}
                <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700/50">
                            <Info className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Request Info</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-1.5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Store className="w-4 h-4 text-gray-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Requesting Store</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                    {data.tenants?.name || 'Unknown Store'}
                                </span>
                                <span className="text-xs text-gray-500 italic">#{data.tenantId}</span>
                            </div>

                            <div className="flex flex-col gap-1.5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Submission Date</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {new Date(data.createdAt).toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className="text-xs text-gray-500">
                                    at {new Date(data.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {data.adminNote && (
                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Official Feedback</span>
                                        </div>
                                        <p className="text-sm italic text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                                            "{data.adminNote}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 transform transition-all duration-300">
                    <div
                        className="absolute inset-0 bg-gray-950/90 backdrop-blur-xl transition-opacity animate-in fade-in duration-500"
                        onClick={() => setSelectedImage(null)}
                    />

                    <div className="relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full border border-white/10 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Asset Verification</span>
                            </div>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="pointer-events-auto p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition border border-white/20 transform hover:scale-110 active:scale-95 shadow-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 sm:p-12 flex flex-col items-center">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2">
                                    Storefront Resolution
                                </h3>
                                <p className="text-sm text-gray-500">Previewing the actual 456x456 pixel scale used in the hero slider.</p>
                            </div>

                            {/* Fixed 456x456 Container with Premium shadow */}
                            <div className="relative group/preview mb-10">
                                <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full transition duration-1000 group-hover/preview:bg-blue-500/20" />
                                <div className="relative border-8 border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl bg-white dark:bg-gray-950 overflow-hidden flex items-center justify-center">
                                    <img
                                        src={selectedImage}
                                        alt="Resolution Preview"
                                        className="w-[280px] h-[280px] sm:w-[456px] sm:h-[456px] object-cover animate-in fade-in duration-1000"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="px-12 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-500/25 transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    Confirm Asset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

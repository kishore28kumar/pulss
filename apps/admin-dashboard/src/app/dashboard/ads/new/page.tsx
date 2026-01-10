
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

const adSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters').optional().or(z.literal('')),
    items: z.array(z.object({
        imageUrl: z.string().url('Must be a valid image URL').min(1, 'Image URL is required'),
        productName: z.string().min(1, 'Product name is required for search redirection'),
    })).min(1, 'At least one image is required').max(4, 'Maximum 4 images allowed'),
});

type AdForm = z.infer<typeof adSchema>;

export default function NewAdPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<AdForm>({
        resolver: zodResolver(adSchema),
        defaultValues: {
            title: '',
            description: '',
            items: [{ imageUrl: '', productName: '' }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    });

    const onSubmit = async (data: AdForm) => {
        setIsSubmitting(true);
        try {
            // Format data for the backend
            const payload = {
                title: data.title,
                description: data.description,
                images: data.items.map(item => item.imageUrl),
                links: data.items.map(item => item.productName),
            };

            await api.post('/ads', payload);

            toast.success('Ad request submitted successfully');
            router.push('/dashboard/ads');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/ads" className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Request New Ad</h1>
                    <p className="text-sm text-gray-500 font-medium italic">Create a new advertisement campaign for your store</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* Title & Description */}
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Campaign Title</label>
                            <input
                                {...register('title')}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="e.g. Festival Season Sale 2024"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Campaign Description (Optional)</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                placeholder="Describe what this ad is about..."
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                        </div>
                    </div>

                    {/* Images & Links Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Ad Assets (Images & Product Names)
                            </label>
                            {fields.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => append({ imageUrl: '', productName: '' })}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Add Another
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 relative group transition-all">
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <ImageIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 uppercase">Image URL {index + 1}</span>
                                            </div>
                                            <input
                                                {...register(`items.${index}.imageUrl`)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                            {errors.items?.[index]?.imageUrl && (
                                                <p className="text-red-500 text-xs mt-1">{errors.items[index]?.imageUrl?.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Plus className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 uppercase">Product Name (for redirection)</span>
                                            </div>
                                            <input
                                                {...register(`items.${index}.productName`)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                                placeholder="e.g. iPhone 15 Pro"
                                            />
                                            {errors.items?.[index]?.productName && (
                                                <p className="text-red-500 text-xs mt-1">{errors.items[index]?.productName?.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Live Preview Hint if URL is valid-ish */}
                                    {fields[index].imageUrl && (
                                        <div className="mt-3">
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Preview (Actual Storefront Size)</div>
                                            <div className="border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
                                                <img
                                                    src={fields[index].imageUrl}
                                                    alt="Preview"
                                                    className="w-[456px] h-[456px] object-cover"
                                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/456?text=Invalid+Image+URL')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 italic">
                            * Make sure the image URLs are publicly accessible. You can host your images on platforms like Unsplash, Imgur, or your own server.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href="/dashboard/ads"
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium shadow-sm active:transform active:scale-95"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

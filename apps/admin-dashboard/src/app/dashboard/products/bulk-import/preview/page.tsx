'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface ProductData {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: string;
  compareAtPrice?: string;
  costPrice?: string;
  sku?: string;
  barcode?: string;
  trackInventory?: string;
  stockQuantity?: string;
  lowStockThreshold?: string;
  weight?: string;
  weightUnit?: string;
  categorySlug?: string;
  images?: string;
  isActive?: string;
  isFeatured?: string;
  requiresPrescription?: string;
  isOTC?: string;
  manufacturer?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface EditableProduct extends ProductData {
  id: string;
  isValid: boolean;
  errors: string[];
  isEditing?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BulkImportPreviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data as Category[];
    },
  });

  useEffect(() => {
    // Load CSV data from sessionStorage
    const storedData = sessionStorage.getItem('bulkImportData');
    if (!storedData) {
      toast.error('No import data found. Please upload a CSV file first.');
      router.push('/dashboard/products/bulk-import');
      return;
    }

    try {
      const csvData: ProductData[] = JSON.parse(storedData);
      const validatedProducts = csvData.map((product, index) => {
        const errors = validateProduct(product, index);
        return {
          ...product,
          id: `temp_${index}`,
          isValid: errors.length === 0,
          errors,
        };
      });
      setProducts(validatedProducts);
    } catch (error) {
      toast.error('Failed to load import data');
      router.push('/dashboard/products/bulk-import');
    }
  }, [router]);

  const validateProduct = (product: ProductData, index: number): string[] => {
    const errors: string[] = [];
    const rowNum = index + 1;

    if (!product.name || product.name.trim().length < 2) {
      errors.push(`Name must be at least 2 characters`);
    }

    if (!product.slug || product.slug.trim().length < 2) {
      errors.push(`Slug must be at least 2 characters`);
    } else if (!/^[a-z0-9-]+$/.test(product.slug)) {
      errors.push(`Slug must contain only lowercase letters, numbers, and hyphens`);
    }

    if (!product.price || isNaN(parseFloat(product.price)) || parseFloat(product.price) < 0) {
      errors.push(`Price must be a valid number >= 0`);
    }

    if (product.compareAtPrice && (isNaN(parseFloat(product.compareAtPrice)) || parseFloat(product.compareAtPrice) < 0)) {
      errors.push(`Compare at price must be a valid number >= 0`);
    }

    if (product.costPrice && (isNaN(parseFloat(product.costPrice)) || parseFloat(product.costPrice) < 0)) {
      errors.push(`Cost price must be a valid number >= 0`);
    }

    if (product.stockQuantity && (isNaN(parseInt(product.stockQuantity)) || parseInt(product.stockQuantity) < 0)) {
      errors.push(`Stock quantity must be a valid integer >= 0`);
    }

    if (product.lowStockThreshold && (isNaN(parseInt(product.lowStockThreshold)) || parseInt(product.lowStockThreshold) < 0)) {
      errors.push(`Low stock threshold must be a valid integer >= 0`);
    }

    if (product.weight && (isNaN(parseFloat(product.weight)) || parseFloat(product.weight) < 0)) {
      errors.push(`Weight must be a valid number >= 0`);
    }

    if (product.images) {
      const imageUrls = product.images.split(',').map((url) => url.trim());
      for (const url of imageUrls) {
        if (url && !isValidUrl(url)) {
          errors.push(`Invalid image URL: ${url}`);
        }
      }
    }

    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleEdit = (product: EditableProduct) => {
    setEditingId(product.id);
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = () => {
    if (!editingProduct || !editingId) return;

    const errors = validateProduct(editingProduct, 0);
    const updatedProduct: EditableProduct = {
      ...editingProduct,
      isValid: errors.length === 0,
      errors,
    };

    setProducts(products.map((p) => (p.id === editingId ? updatedProduct : p)));
    setEditingId(null);
    setEditingProduct(null);
    toast.success('Product updated');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingProduct(null);
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this product from the import?')) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Product removed');
    }
  };

  const handleFieldChange = (field: keyof ProductData, value: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      [field]: value,
    });
  };

  // Bulk publish mutation
  const publishMutation = useMutation({
    mutationFn: async (productsToPublish: EditableProduct[]) => {
      const validProducts = productsToPublish.filter((p) => p.isValid);
      
      if (validProducts.length === 0) {
        throw new Error('No valid products to publish');
      }

      // Find category IDs from slugs
      const categoryMap = new Map(categories?.map((cat) => [cat.slug, cat.id]) || []);

      const results = [];
      const errors = [];

      for (const product of validProducts) {
        try {
          // Find category ID from slug
          const categoryId = product.categorySlug
            ? categoryMap.get(product.categorySlug) || null
            : null;

          if (!categoryId && product.categorySlug) {
            errors.push(`${product.name}: Category "${product.categorySlug}" not found`);
            continue;
          }

          const payload = {
            name: product.name,
            slug: product.slug,
            description: product.description || undefined,
            shortDescription: product.shortDescription || undefined,
            price: parseFloat(product.price),
            compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : undefined,
            costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
            sku: product.sku || undefined,
            barcode: product.barcode || undefined,
            trackInventory: product.trackInventory === 'true' || product.trackInventory === '1' || product.trackInventory === '',
            stockQuantity: product.stockQuantity ? parseInt(product.stockQuantity) : undefined,
            lowStockThreshold: product.lowStockThreshold ? parseInt(product.lowStockThreshold) : undefined,
            weight: product.weight ? parseFloat(product.weight) : undefined,
            weightUnit: product.weightUnit || undefined,
            categoryIds: categoryId ? [categoryId] : [],
            images: product.images ? product.images.split(',').map((url) => url.trim()).filter(Boolean) : undefined,
            isActive: product.isActive === 'true' || product.isActive === '1' || product.isActive === '',
            isFeatured: product.isFeatured === 'true' || product.isFeatured === '1',
            requiresPrescription: product.requiresPrescription === 'true' || product.requiresPrescription === '1',
            isOTC: product.isOTC === 'true' || product.isOTC === '1',
            manufacturer: product.manufacturer || undefined,
            metaTitle: product.metaTitle || undefined,
            metaDescription: product.metaDescription || undefined,
          };

          const response = await api.post('/products', payload);
          results.push({ success: true, product: product.name });
        } catch (error: any) {
          errors.push(`${product.name}: ${error.response?.data?.error || error.message}`);
        }
      }

      return { results, errors };
    },
    onSuccess: (data) => {
      const successCount = data.results.length;
      const errorCount = data.errors.length;

      if (successCount > 0) {
        toast.success(`Successfully published ${successCount} product(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to publish ${errorCount} product(s)`);
        console.error('Publish errors:', data.errors);
      }

      // Clear session storage
      sessionStorage.removeItem('bulkImportData');
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Redirect to products page
      router.push('/dashboard/products');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish products');
    },
  });

  const handlePublish = () => {
    const validProducts = products.filter((p) => p.isValid);
    const invalidProducts = products.filter((p) => !p.isValid);

    if (validProducts.length === 0) {
      toast.error('No valid products to publish. Please fix errors first.');
      return;
    }

    if (invalidProducts.length > 0) {
      if (!confirm(`You have ${invalidProducts.length} invalid product(s) that will be skipped. Continue?`)) {
        return;
      }
    }

    publishMutation.mutate(validProducts);
  };

  const validCount = products.filter((p) => p.isValid).length;
  const invalidCount = products.filter((p) => !p.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/products/bulk-import"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Import
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Review & Validate Products</h1>
        <p className="text-gray-500 mt-1">Review your products before publishing</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
            <div className="text-sm text-gray-500">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{validCount}</div>
            <div className="text-sm text-gray-500">Valid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{invalidCount}</div>
            <div className="text-sm text-gray-500">Invalid</div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === product.id && editingProduct ? (
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    )}
                    {product.errors.length > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {product.errors[0]}
                        {product.errors.length > 1 && ` (+${product.errors.length - 1} more)`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id && editingProduct ? (
                      <input
                        type="text"
                        value={editingProduct.slug}
                        onChange={(e) => handleFieldChange('slug', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{product.slug}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === product.id && editingProduct ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.price}
                        onChange={(e) => handleFieldChange('price', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {formatCurrency(parseFloat(product.price || '0'))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stockQuantity || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.categorySlug || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 text-green-600 hover:text-green-700 transition"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:text-gray-600 transition"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500">
          {validCount > 0 && (
            <span className="text-green-600 font-medium">{validCount} product(s) ready to publish</span>
          )}
          {invalidCount > 0 && (
            <span className="text-red-600 font-medium ml-4">
              {invalidCount} product(s) need attention
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/products/bulk-import"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending || validCount === 0}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              `Publish ${validCount} Product(s)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


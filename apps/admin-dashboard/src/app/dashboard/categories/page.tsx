'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, FolderTree } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import CategoryModal from './CategoryModal';
import PermissionGuard from '@/components/permissions/PermissionGuard';
import { Permission } from '@/lib/permissions';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  displayOrder: number;
  _count?: {
    products: number;
  };
  categories?: Category;
  other_categories?: Category[];
}

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      const response = await api.get('/categories', {
        params: { search },
      });
      return response.data.data as Category[];
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    },
  });

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (category._count?.products && category._count.products > 0) {
      toast.error(`Cannot delete category with ${category._count.products} products`);
      return;
    }
    if (category.other_categories && category.other_categories.length > 0) {
      toast.error('Cannot delete category with subcategories');
      return;
    }
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // Filter categories for display
  const filteredCategories = categories?.filter((cat) => 
    search ? cat.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Organize your products into categories</p>
        </div>
        <PermissionGuard permission={Permission.CATEGORIES_CREATE}>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {categories?.length || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {categories?.filter(c => c.isActive).length || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {categories?.filter(c => !c.isActive).length || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">With Subcategories</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {categories?.filter(c => c.other_categories && c.other_categories.length > 0).length || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <FolderTree className="w-6 h-6 text-purple-600" />
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
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Loading categories...</p>
          </div>
        ) : filteredCategories && filteredCategories.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
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
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                            {category.image ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={category.image}
                                alt={category.name}
                              />
                            ) : (
                              <FolderTree className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.categories?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {category._count?.products || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.displayOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <PermissionGuard permission={Permission.CATEGORIES_UPDATE}>
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission={Permission.CATEGORIES_DELETE}>
                            <button
                              onClick={() => handleDelete(category)}
                              className="p-2 text-gray-400 hover:text-red-600 transition"
                              disabled={deleteMutation.isPending}
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
          </>
        ) : (
          <div className="p-12 text-center">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Try adjusting your search' : 'Get started by creating your first category'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <CategoryModal
          category={selectedCategory}
          categories={categories || []}
          onClose={handleModalClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}


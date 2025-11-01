import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Image as ImageIcon, 
  Package,
  MagnifyingGlass,
  Plus,
  Funnel,
  Download
} from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { EnhancedCSVUpload } from '@/components/EnhancedCSVUpload'
import { BulkImageUpload } from '@/components/BulkImageUpload'
import { ProductCardEditor } from '@/components/ProductCardEditor'
import { useAuth } from '@/lib/useAuth'

interface Product {
  product_id: string
  name: string
  description?: string
  brand?: string
  pack_size?: string
  price: number
  mrp: number
  image_url?: string
  images?: string[]
  sku?: string
  tags?: string[]
  active: boolean
  featured: boolean
  inventory_count?: number
  offer_badge_text?: string
  offer_badge_visible?: boolean
  discount_percentage?: number
  is_bundle?: boolean
  category_name?: string
}

export const ProductManagement = () => {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Fetch products
  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['products', profile?.tenant_id, searchQuery, filterActive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filterActive !== 'all') params.append('active', filterActive)

      const response = await fetch(
        `/api/products/tenants/${profile?.tenant_id}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      return data
    },
    enabled: !!profile?.tenant_id
  })

  const handleImportComplete = () => {
    refetch()
  }

  const handleProductUpdate = (updatedProduct: Product) => {
    refetch()
  }

  const products = productsData?.products || []

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Catalog Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, upload images, and import from CSV
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="h-5 w-5 mr-2" />
            {products.length} Products
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="csv-upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>CSV Import</span>
          </TabsTrigger>
          <TabsTrigger value="bulk-images" className="flex items-center space-x-2">
            <ImageIcon className="h-4 w-4" />
            <span>Bulk Images</span>
          </TabsTrigger>
          <TabsTrigger value="edit-product" disabled={!selectedProduct} className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Edit Product</span>
          </TabsTrigger>
        </TabsList>

        {/* Products List Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>Browse and manage all products</CardDescription>
                </div>
                <Button onClick={() => setActiveTab('csv-upload')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Products
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="true">Active Only</SelectItem>
                    <SelectItem value="false">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No products found</p>
                  <Button onClick={() => setActiveTab('csv-upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product: Product) => (
                    <Card 
                      key={product.product_id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedProduct(product)
                        setActiveTab('edit-product')
                      }}
                    >
                      <CardContent className="pt-6">
                        {/* Image */}
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop'
                            }}
                          />
                        </div>

                        {/* Info */}
                        <div className="space-y-2">
                          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                          
                          {product.brand && (
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                          )}

                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-primary">₹{product.price}</span>
                            {product.mrp > product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.mrp}
                              </span>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1">
                            {!product.active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {product.featured && (
                              <Badge variant="default">Featured</Badge>
                            )}
                            {product.offer_badge_visible && product.offer_badge_text && (
                              <Badge variant="destructive">{product.offer_badge_text}</Badge>
                            )}
                            {product.sku && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {product.sku}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Upload Tab */}
        <TabsContent value="csv-upload">
          <EnhancedCSVUpload
            tenantId={profile?.tenant_id || ''}
            onImportComplete={handleImportComplete}
          />
        </TabsContent>

        {/* Bulk Images Tab */}
        <TabsContent value="bulk-images">
          <BulkImageUpload
            tenantId={profile?.tenant_id || ''}
            onUploadComplete={handleImportComplete}
          />
        </TabsContent>

        {/* Edit Product Tab */}
        <TabsContent value="edit-product">
          {selectedProduct ? (
            <ProductCardEditor
              product={selectedProduct}
              tenantId={profile?.tenant_id || ''}
              onUpdate={handleProductUpdate}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select a product from the Products tab to edit
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Package,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Tag,
} from 'lucide-react';
import api from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import ProductCard from '@/components/products/ProductCard';

function ProductDetailContent() {
  const params = useParams();
  const slug = params.slug as string;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addToCart, isAddingToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, isLoaded: wishlistLoaded } = useWishlist();

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await api.get(`/products/${slug}`);
      return response.data.data;
    },
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.categoryId],
    queryFn: async () => {
      if (!product?.categoryId) return null;
      const response = await api.get('/products', {
        params: { categoryId: product.categoryId, limit: 4 },
      });
      return response.data.data.data.filter((p: any) => p.id !== product.id);
    },
    enabled: !!product?.categoryId,
  });

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        quantity,
      });
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      const inWishlist = isInWishlist(product.id);
      if (inWishlist) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist({
          id: `wishlist_${product.id}`,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          thumbnail: product.thumbnail || product.images?.[0] || '',
        });
      }
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const images = product?.images || [];
  const currentImage = images[selectedImage] || product?.thumbnail;
  const inWishlist = wishlistLoaded && product ? isInWishlist(product.id) : false;
  const inStock = product && product.stock > 0;
  const discount = product?.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="text-gray-600 mt-4 text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600 transition">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Product Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-10">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{discount}%
                  </div>
                )}

                {/* Stock Badge */}
                {!inStock && (
                  <div className="absolute top-4 right-4 bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index
                          ? 'border-blue-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                {product.categories && (
                  <Link
                    href={`/categories?id=${product.categoryId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {product.categories.name}
                  </Link>
                )}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-3">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">(4.8 / 5.0)</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-600">245 reviews</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      ${product.comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.comparePrice && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    You save ${(product.comparePrice - product.price).toFixed(2)} ({discount}%)
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  {inStock ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">
                        In Stock ({product.stock} available)
                      </span>
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 py-3 font-semibold text-gray-900 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= product.stock}
                        className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      Max: {product.stock} units
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || isAddingToCart}
                  className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/30"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>
                
                <button
                  onClick={handleToggleWishlist}
                  className={`px-6 py-4 border-2 rounded-xl font-semibold transition ${
                    inWishlist
                      ? 'border-pink-600 bg-pink-50 text-pink-600 hover:bg-pink-100'
                      : 'border-gray-300 text-gray-700 hover:border-pink-600 hover:text-pink-600'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${inWishlist ? 'fill-pink-600' : ''}`}
                  />
                </button>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Free Shipping</h3>
                    <p className="text-xs text-gray-600">On orders over $50</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Easy Returns</h3>
                    <p className="text-xs text-gray-600">30-day return policy</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Secure Payment</h3>
                    <p className="text-xs text-gray-600">100% secure checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-10 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
          
          {/* Specifications */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">SKU</span>
                  <span className="text-gray-900 font-medium">{product.sku}</span>
                </div>
                {product.manufacturer && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Manufacturer</span>
                    <span className="text-gray-900 font-medium">{product.manufacturer}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Availability</span>
                  <span className={`font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {product.requiresPrescription && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Prescription</span>
                    <span className="text-orange-600 font-medium">Required</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              <Link
                href={`/categories?id=${product.categoryId}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return <ProductDetailContent />;
}


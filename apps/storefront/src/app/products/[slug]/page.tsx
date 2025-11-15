'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
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
  ChevronRight,
  Zap,
} from 'lucide-react';
import api from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import { useWishlist } from '@/hooks/useWishlist';
import ProductCard from '@/components/products/ProductCard';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const { addItem } = useCartStore();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

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
    if (!product) return;
    
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      thumbnail: product.thumbnail,
      images: product.images,
      stock: stock,
    }, quantity);
    
    toast.success('Added to cart');
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    setIsBuyingNow(true);
    
    // Add to cart
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      thumbnail: product.thumbnail,
      images: product.images,
      stock: stock,
    }, quantity);
    
    // Redirect to cart/checkout
    setTimeout(() => {
      router.push('/cart');
    }, 500);
  };

  const handleToggleWishlist = () => {
    if (product) {
      const inWishlist = isInWishlist(product.id);
      if (inWishlist) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist({
          id: product.id,
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
    if (product && quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const images = product?.images || [];
  const currentImage = images[selectedImage] || product?.thumbnail || '';
  const inWishlist = product ? isInWishlist(product.id) : false;
  const stock = product?.stock || product?.stockQuantity || 0;
  const inStock = stock > 0;
  const comparePrice = product?.comparePrice || product?.compareAtPrice;
  const discount = comparePrice
    ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
    : 0;
  const rating = product?.rating || 4.5;
  const reviewCount = product?.reviewCount || 245;

  // Estimated delivery date (3-5 business days)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

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
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/products" className="hover:text-blue-600 transition">Products</Link>
          <ChevronRight className="w-4 h-4" />
          {product.categories && (
            <>
              <Link href={`/categories?id=${product.categoryId}`} className="hover:text-blue-600 transition">
                {product.categories.name}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8 md:mb-12 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 p-4 md:p-6 lg:p-8">
            {/* Image Gallery - Full Width */}
            <div>
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-sm">
                    -{discount}%
                  </div>
                )}

                {/* Stock Badge */}
                {!inStock && (
                  <div className="absolute top-4 right-4 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-bold shadow-sm">
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
                      className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition ${
                        selectedImage === index
                          ? 'border-blue-600'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 12.5vw"
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
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <Link href="#reviews" className="text-sm text-blue-600 hover:text-blue-700">
                    {reviewCount} reviews
                  </Link>
                </div>
              </div>

              {/* Price Block */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {comparePrice && (
                    <span className="text-2xl text-gray-500 line-through">
                      {formatCurrency(comparePrice)}
                    </span>
                  )}
                </div>
                {comparePrice && (
                  <p className="text-sm text-green-600 font-medium">
                    You save {formatCurrency(comparePrice - product.price)} ({discount}%)
                  </p>
                )}
              </div>

              {/* Delivery & Returns Info */}
              <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Free Delivery</p>
                    <p className="text-sm text-gray-600">
                      Estimated delivery: {estimatedDelivery.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Easy Returns</p>
                    <p className="text-sm text-gray-600">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure checkout</p>
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  {inStock ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">
                        In Stock ({stock} available)
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-300 rounded-md overflow-hidden">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 py-3 font-semibold text-gray-900 min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= stock}
                        className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600">
                      Max: {stock} units
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={handleBuyNow}
                  disabled={!inStock || isBuyingNow}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-md font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <Zap className="w-5 h-5" />
                  <span>{isBuyingNow ? 'Processing...' : 'Buy Now'}</span>
                </button>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                
                <button
                  onClick={handleToggleWishlist}
                  className={`px-6 py-4 border-2 rounded-md font-semibold transition ${
                    inWishlist
                      ? 'border-pink-600 bg-pink-50 text-pink-600 hover:bg-pink-100'
                      : 'border-gray-300 text-gray-700 hover:border-pink-600 hover:text-pink-600'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    className={`w-5 h-5 ${inWishlist ? 'fill-pink-600' : ''}`}
                  />
                </button>
              </div>

              {/* Fulfilled By Info */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fulfilled by:</span> Pulss Store
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ships from our warehouse • Free returns within 30 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 lg:p-8 mb-8 md:mb-12 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
          
          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
          
          {/* Specifications */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">SKU</span>
                  <span className="text-gray-900 font-medium">{product.sku || 'N/A'}</span>
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section (Placeholder) */}
        <div id="reviews" className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 lg:p-8 mb-8 md:mb-12 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-600">Reviews feature coming soon</p>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              <Link
                href={`/categories?id=${product.categoryId}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

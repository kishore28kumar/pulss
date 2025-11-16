'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function WishlistTestContent() {
  const { wishlist, addToWishlist, removeFromWishlist, wishlistCount, isInWishlist } = useWishlist();

  const addTestItem = () => {
    addToWishlist({
      id: `test-${Date.now()}`,
      productId: `prod-${Date.now()}`,
      name: 'Test Product ' + Date.now(),
      slug: 'test-product',
      price: 29.99,
      thumbnail: 'https://via.placeholder.com/300',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Wishlist Debug Page</h1>
          
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Status</h2>
              <p className="text-gray-700">Wishlist Count: <strong>{wishlistCount}</strong></p>
              <p className="text-gray-700">Items in wishlist: <strong>{wishlist.length}</strong></p>
            </div>

            {/* Add Test Item */}
            <button
              onClick={addTestItem}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Add Test Item to Wishlist
            </button>

            {/* Wishlist Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Current Wishlist Items:</h2>
              {wishlist.length === 0 ? (
                <p className="text-gray-500">No items in wishlist</p>
              ) : (
                <div className="space-y-2">
                  {wishlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">₹{item.price}</p>
                        <p className="text-xs text-gray-500">Added: {new Date(item.addedAt).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LocalStorage Check */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">LocalStorage Check:</h2>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem('wishlist');
                    alert('LocalStorage wishlist: ' + (stored || 'empty'));
                    console.log('LocalStorage wishlist:', stored);
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
              >
                Check LocalStorage
              </button>
            </div>

            {/* Test isInWishlist */}
            <div className="bg-green-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Test isInWishlist Function:</h2>
              <p className="text-sm text-gray-600 mb-2">Check if product ID exists in wishlist</p>
              <input
                type="text"
                placeholder="Enter product ID"
                id="productIdTest"
                className="w-full px-4 py-2 border rounded mb-2"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('productIdTest') as HTMLInputElement;
                  const productId = input.value;
                  const inWishlist = isInWishlist(productId);
                  alert(`Product ${productId} is ${inWishlist ? 'IN' : 'NOT IN'} wishlist`);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WishlistTestPage() {
  return (
    <ProtectedRoute>
      <WishlistTestContent />
    </ProtectedRoute>
  );
}


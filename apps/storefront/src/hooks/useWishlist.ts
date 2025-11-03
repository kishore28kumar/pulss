import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string;
  addedAt: string;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wishlist');
      console.log('🔍 Loading wishlist from localStorage:', stored);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('✅ Parsed wishlist:', parsed);
          setWishlist(parsed);
        } catch (error) {
          console.error('❌ Failed to parse wishlist:', error);
        }
      } else {
        console.log('ℹ️ No wishlist found in localStorage');
      }
      setIsLoaded(true);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      console.log('💾 Saving wishlist to localStorage:', wishlist);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const addToWishlist = (product: Omit<WishlistItem, 'addedAt'>) => {
    const isAlreadyInWishlist = wishlist.some(item => item.productId === product.productId);
    
    if (isAlreadyInWishlist) {
      toast.info('Item already in wishlist');
      return;
    }

    const newItem: WishlistItem = {
      ...product,
      addedAt: new Date().toISOString(),
    };

    setWishlist(prev => [...prev, newItem]);
    toast.success('Added to wishlist');
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.productId !== productId));
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.productId === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    toast.success('Wishlist cleared');
  };

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    wishlistCount: wishlist.length,
  };
}


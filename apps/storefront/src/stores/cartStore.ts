import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productSlug: string;
  price: number;
  quantity: number;
  stockQuantity: number;
}

interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  
  // Actions
  addItem: (product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    thumbnail?: string;
    images?: string[];
    stock: number;
  }, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);

        if (existingItem) {
          // Update quantity if item exists
          const newQuantity = existingItem.quantity + quantity;
          const updatedItems = items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: Math.min(newQuantity, product.stock) }
              : item
          );
          set({
            items: updatedItems,
            subtotal: calculateSubtotal(updatedItems),
            itemCount: calculateItemCount(updatedItems),
          });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `cart_${product.id}_${Date.now()}`,
            productId: product.id,
            productName: product.name,
            productImage: product.thumbnail || product.images?.[0] || '',
            productSlug: product.slug,
            price: product.price,
            quantity: Math.min(quantity, product.stock),
            stockQuantity: product.stock,
          };
          const updatedItems = [...items, newItem];
          set({
            items: updatedItems,
            subtotal: calculateSubtotal(updatedItems),
            itemCount: calculateItemCount(updatedItems),
          });
        }
      },

      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const item = items.find(i => i.productId === productId);
        if (!item) return;

        const updatedItems = items.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(Math.max(1, quantity), item.stockQuantity) }
            : item
        ).filter(item => item.quantity > 0);

        set({
          items: updatedItems,
          subtotal: calculateSubtotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        });
      },

      removeItem: (productId) => {
        const items = get().items;
        const updatedItems = items.filter(item => item.productId !== productId);
        set({
          items: updatedItems,
          subtotal: calculateSubtotal(updatedItems),
          itemCount: calculateItemCount(updatedItems),
        });
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          itemCount: 0,
        });
      },

      setCart: (items) => {
        set({
          items,
          subtotal: calculateSubtotal(items),
          itemCount: calculateItemCount(items),
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getSubtotal: () => calculateSubtotal(get().items),
      getItemCount: () => calculateItemCount(get().items),
    }),
    {
      name: 'pulss-cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);


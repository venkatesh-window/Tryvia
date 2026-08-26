import { create } from 'zustand';
import { Product } from '../api/schemas/product';

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: number) => boolean;
  removeFromWishlist: (productId: number) => void;
  clearWishlist: () => void;
}

// Initial sample luxury wishlisted item
const INITIAL_WISHLIST: Product[] = [];

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: INITIAL_WISHLIST,

  toggleWishlist: (product: Product) => {
    set((state) => {
      const exists = state.items.some(item => item.id === product.id);
      if (exists) {
        return { items: state.items.filter(item => item.id !== product.id) };
      } else {
        return { items: [product, ...state.items] };
      }
    });
  },

  isInWishlist: (productId: number) => {
    return get().items.some(item => item.id === productId);
  },

  removeFromWishlist: (productId: number) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== productId),
    }));
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));

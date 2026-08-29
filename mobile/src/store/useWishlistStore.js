import { create } from "zustand";

// Initial sample luxury wishlisted item
const INITIAL_WISHLIST = [];

export const useWishlistStore = create((set, get) => ({
  items: INITIAL_WISHLIST,

  toggleWishlist: (product) => {
    set((state) => {
      const exists = state.items.some((item) => item.id === product.id);
      if (exists) {
        return { items: state.items.filter((item) => item.id !== product.id) };
      } else {
        return { items: [product, ...state.items] };
      }
    });
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.id === productId);
  },

  removeFromWishlist: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));

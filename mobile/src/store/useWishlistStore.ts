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
const INITIAL_WISHLIST: Product[] = [
  {
    id: 3,
    name: 'Advanced Night Repair',
    full_price: 8900,
    tester_price: 450,
    stock_full: 80,
    stock_tester: 200,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop',
    description: 'The #1 serum in the US. Experience the power of 7 serums in 1: line reduction, firmness, even tone, strengthening, hydration, radiance, and antioxidants.',
    brand: { id: 3, name: 'Estee Lauder' },
  },
];

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

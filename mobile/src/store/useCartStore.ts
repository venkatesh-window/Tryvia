import { create } from 'zustand';
import { Product } from '../api/schemas/product';

export interface CartItem {
  id: string; // unique ID for cart row
  product: Product;
  type: 'tester' | 'full';
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  
  // Computed
  totalItems: number;
  subtotal: number;
  walletDeduction: number;
  total: number;
  
  // Actions
  addItem: (product: Product, type: 'tester' | 'full') => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkout: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  totalItems: 0,
  subtotal: 0,
  walletDeduction: 0,
  total: 0,

  addItem: (product, type) => {
    set((state) => {
      // Allow only 1 quantity per type for now to match UI simplicity
      const existingItemIndex = state.items.findIndex(
        (i) => i.product.id === product.id && i.type === type
      );

      let newItems = [...state.items];
      
      if (existingItemIndex > -1) {
        newItems[existingItemIndex].quantity += 1;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${type}-${Date.now()}`,
          product,
          type,
          quantity: 1,
          price: type === 'tester' ? product.tester_price : product.full_price,
        };
        newItems.push(newItem);
      }
      
      return calculateTotals(newItems);
    });
  },

  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter(i => i.id !== id);
      return calculateTotals(newItems);
    });
  },

  clearCart: () => {
    set({
      items: [],
      totalItems: 0,
      subtotal: 0,
      walletDeduction: 0,
      total: 0
    });
  },

  checkout: () => {
    const state = get();
    const { useAuthStore } = require('./useAuthStore');
    const authStore = useAuthStore.getState();

    // 1. Calculate testers bought to add to wallet
    const testersBought = state.items.filter(i => i.type === 'tester');
    const testerCashbackEarned = testersBought.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 2. Add cashback to wallet
    if (testerCashbackEarned > 0) {
      authStore.addWalletBalance(testerCashbackEarned);
    }

    // 3. Deduct applied wallet credits from wallet
    if (state.walletDeduction > 0) {
      authStore.deductWalletBalance(state.walletDeduction);
    }

    // 4. Clear cart
    state.clearCart();
  }
}));

// Helper to recalculate totals
function calculateTotals(items: CartItem[]) {
  const { useAuthStore } = require('./useAuthStore');
  const userWallet = useAuthStore.getState().user?.walletBalance || 0;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Wallet deduction logic: 
  // You can only apply wallet balance to FULL size products. 
  // Let's cap the deduction at 100% of the full size product price or the user's wallet balance, whichever is smaller.
  const fullSizeCost = items
    .filter(i => i.type === 'full')
    .reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const walletDeduction = Math.min(fullSizeCost, userWallet);
  const total = subtotal - walletDeduction;

  return {
    items,
    totalItems,
    subtotal,
    walletDeduction,
    total
  };
}

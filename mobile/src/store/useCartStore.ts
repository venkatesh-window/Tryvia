import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../api/schemas/product';
import { walletService, WalletCredit } from '../api/services/walletService';

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
  platformFee: number;
  total: number;
  
  // Wallet
  appliedWalletCredit: WalletCredit | null;
  isCheckingEligibility: boolean;
  
  // Actions
  addItem: (product: Product, type: 'tester' | 'full') => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkWalletEligibility: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  items: [],
  
  totalItems: 0,
  subtotal: 0,
  walletDeduction: 0,
  platformFee: 0,
  total: 0,
  
  appliedWalletCredit: null,
  isCheckingEligibility: false,

  addItem: (product, type) => {
    set((state) => {
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
      
      return calculateTotals(newItems, state.appliedWalletCredit);
    });
    
    // Check eligibility asynchronously after adding an item
    get().checkWalletEligibility();
  },

  removeItem: (id) => {
    set((state) => {
      const newItems = state.items.filter(i => i.id !== id);
      return calculateTotals(newItems, state.appliedWalletCredit);
    });
    get().checkWalletEligibility();
  },

  clearCart: () => {
    set({
      items: [],
      totalItems: 0,
      subtotal: 0,
      walletDeduction: 0,
      platformFee: 0,
      total: 0,
      appliedWalletCredit: null,
      isCheckingEligibility: false
    });
  },

  checkWalletEligibility: async () => {
    const state = get();
    // Only check if we have a full-size product
    const fullSizeItems = state.items.filter(i => i.type === 'full');
    
    if (fullSizeItems.length === 0) {
      set((s) => ({ ...calculateTotals(s.items, null), appliedWalletCredit: null }));
      return;
    }

    // For simplicity, just check the first full size product
    const targetProduct = fullSizeItems[0].product;
    
    set({ isCheckingEligibility: true });
    try {
      const eligibility = await walletService.checkEligibility(targetProduct.id);
      
      set((s) => {
        const credit = eligibility.eligible ? eligibility.credit : null;
        return {
          ...calculateTotals(s.items, credit),
          appliedWalletCredit: credit,
          isCheckingEligibility: false
        };
      });
    } catch (e) {
      console.log('Error checking wallet eligibility:', e);
      set({ isCheckingEligibility: false });
    }
  }
  }),
  {
    name: 'tryvia-cart-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
));

// Helper to recalculate totals
function calculateTotals(items: CartItem[], appliedCredit: WalletCredit | null) {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let walletDeduction = 0;
  let platformFee = 0;
  
  if (appliedCredit) {
    walletDeduction = appliedCredit.redeemable_amount;
    platformFee = appliedCredit.platform_fee;
  }
  
  // Final total = Subtotal - Discount
  const total = subtotal - walletDeduction;

  return {
    items,
    totalItems,
    subtotal,
    walletDeduction,
    platformFee,
    total
  };
}

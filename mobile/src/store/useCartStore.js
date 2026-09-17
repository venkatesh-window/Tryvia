import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { walletService } from "../api/services/walletService";

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      walletDeduction: 0,
      platformFee: 0,
      deliveryCharge: 0,
      total: 0,
      appliedWalletCredit: null,
      isCheckingEligibility: false,
      useWallet: true,

      toggleUseWallet: () => {
        set((state) => {
          const newUseWallet = !state.useWallet;
          return { useWallet: newUseWallet, ...calculateTotals(state.items, newUseWallet) };
        });
      },

      addItem: (product, type) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.product.id === product.id && i.type === type,
          );

          let newItems = [...state.items];
          if (existingItemIndex > -1) {
            newItems[existingItemIndex].quantity += 1;
          } else {
            const newItem = {
              id: `${product.id}-${type}-${Date.now()}`,
              product,
              type,
              quantity: 1,
              price:
                type === "tester" ? product.tester_price : product.full_price,
            };
            newItems.push(newItem);
          }
          return calculateTotals(newItems, state.useWallet);
        });
        get().checkWalletEligibility();
      },

      removeItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== id);
          return calculateTotals(newItems, state.useWallet);
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
          deliveryCharge: 0,
          total: 0,
          appliedWalletCredit: null,
          isCheckingEligibility: false,
          useWallet: true,
        });
      },

      checkWalletEligibility: async () => {
        set((s) => {
          const totals = calculateTotals(s.items, s.useWallet);
          return {
            ...totals,
            appliedWalletCredit: totals.walletDeduction > 0 ? {
              id: "general_wallet",
              redeemable_amount: totals.walletDeduction,
              original_amount: totals.walletDeduction,
            } : null,
            isCheckingEligibility: false,
          };
        });
      },
    }),
    {
      name: "tryvia-cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Helper to recalculate totals
function calculateTotals(items, useWallet = true) {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  let walletDeduction = 0;
  let platformFee = 10;
  let deliveryCharge = 40;
  let total = subtotal;

  const originalProductsTotal = items
    .filter((i) => i.type === "full")
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  const miniProductsTotal = items
    .filter((i) => i.type === "tester")
    .reduce((acc, item) => acc + item.price * item.quantity, 0);

  let walletBalance = 0;
  try {
    const { useAuthStore } = require("./useAuthStore");
    walletBalance = useAuthStore.getState().user?.walletBalance || 0;
  } catch (err) {
    console.log("Could not read walletBalance:", err);
  }

  if (useWallet && originalProductsTotal > 0 && walletBalance > 0) {
    const maximumWalletUsage = originalProductsTotal * 0.60;
    walletDeduction = Math.min(walletBalance, maximumWalletUsage);
  }

  const productAmount = originalProductsTotal - walletDeduction;
  total = productAmount + platformFee + deliveryCharge + miniProductsTotal;

  return {
    items,
    totalItems,
    subtotal,
    walletDeduction,
    platformFee,
    deliveryCharge,
    total,
  };
}

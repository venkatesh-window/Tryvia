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
      productSubtotal: 0,
      testerSubtotal: 0,
      walletDeduction: 0,
      platformFee: 0,
      deliveryCharge: 0,
      testerGst: 0,
      productDeliveryFee: 0,
      testerDeliveryFee: 0,
      productSectionTotal: 0,
      testerSectionTotal: 0,
      isTesterMinimumMet: true,
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
          productSubtotal: 0,
          testerSubtotal: 0,
          walletDeduction: 0,
          platformFee: 0,
          deliveryCharge: 0,
          testerGst: 0,
          productDeliveryFee: 0,
          testerDeliveryFee: 0,
          productSectionTotal: 0,
          testerSectionTotal: 0,
          isTesterMinimumMet: true,
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

function calculateTotals(items, useWallet = true) {
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const fullProducts = items.filter(i => i.type === "full");
  const testerProducts = items.filter(i => i.type === "tester");

  const productSubtotal = fullProducts.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const testerSubtotal = testerProducts.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let walletBalance = 0;
  try {
    const { useAuthStore } = require("./useAuthStore");
    walletBalance = useAuthStore.getState().user?.walletBalance || 0;
  } catch (err) {
    console.log("Could not read walletBalance:", err);
  }

  let walletDeduction = 0;
  if (useWallet && productSubtotal > 0 && walletBalance > 0) {
    const maximumWalletUsage = productSubtotal * 0.60;
    walletDeduction = Math.min(walletBalance, maximumWalletUsage);
  }

  let productPlatformFee = 0;
  let productDeliveryFee = 0;
  let productSectionTotal = 0;

  if (fullProducts.length > 0) {
    productPlatformFee = 10;
    productDeliveryFee = 40;
    productSectionTotal = productSubtotal - walletDeduction + productPlatformFee + productDeliveryFee;
  }

  let testerGst = 0;
  let testerDeliveryFee = 0;
  let testerSectionTotal = 0;

  if (testerProducts.length > 0) {
    testerGst = testerSubtotal * 0.18;
    testerDeliveryFee = 40;
    testerSectionTotal = testerSubtotal + testerGst + testerDeliveryFee;
  }

  const deliveryCharge = productDeliveryFee + testerDeliveryFee;
  const platformFee = productPlatformFee;
  const total = productSectionTotal + testerSectionTotal;

  const isTesterMinimumMet = testerProducts.length === 0 || testerSubtotal >= 200;

  return {
    items,
    totalItems,
    subtotal,
    productSubtotal,
    testerSubtotal,
    walletDeduction,
    platformFee,
    deliveryCharge,
    testerGst,
    productDeliveryFee,
    testerDeliveryFee,
    productSectionTotal,
    testerSectionTotal,
    isTesterMinimumMet,
    total,
  };
}

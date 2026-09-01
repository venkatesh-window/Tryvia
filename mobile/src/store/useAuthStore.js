import { create } from "zustand";
import { setItemAsync, getItemAsync, deleteItemAsync } from "../utils/storage";
import { authService } from "../api/services/authService";

const TOKEN_KEY = "tryvia_jwt_token";

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (token, user) => {
    await setItemAsync(TOKEN_KEY, token);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreToken: async () => {
    try {
      set({ isLoading: true });
      let token = await getItemAsync(TOKEN_KEY);
      let user = null;

      if (token) {
        try {
          user = await authService.getMe();
        } catch (err) {
          await deleteItemAsync(TOKEN_KEY);
          token = null;
        }
      }
      if (token && user) {
        const frontendUser = {
          id: user.id || 1,
          email: user.email || "",
          fullName: user.full_name || user.email?.split("@")[0] || "Member",
          role: user.role || "CUSTOMER",
          phone: user.phone || "",
          loyaltyTier: user.loyalty_tier || "TRYVIA MEMBER",
          walletBalance: user.wallet_balance ?? 0,
          points: user.points || 0,
          tryviaStars: user.stars || 0,
          address: user.address || null,
          preferences: user.preferences || {},
        };
        set({
          token,
          user: frontendUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (e) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          ...updates,
          address: updates.address
            ? { ...state.user.address, ...updates.address }
            : state.user.address,
          preferences: updates.preferences
            ? { ...state.user.preferences, ...updates.preferences }
            : state.user.preferences,
        },
      };
    });
  },

  addWalletBalance: (amount) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          walletBalance: state.user.walletBalance + amount,
        },
      };
    });
  },

  deductWalletBalance: (amount) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          walletBalance: Math.max(0, state.user.walletBalance - amount),
        },
      };
    });
  },

  addStars: (amount) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          tryviaStars: (state.user.tryviaStars || 0) + amount,
        },
      };
    });
  },
}));

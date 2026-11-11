import { create } from "zustand";
import { setItemAsync, getItemAsync, deleteItemAsync } from "../utils/storage";
import { authService } from "../api/services/authService";
import { setUnauthorizedHandler } from "../api/client";

const TOKEN_KEY = "tryvia_jwt_token";
const USER_KEY = "tryvia_user_profile";

const saveCachedUser = async (userObj) => {
  try {
    if (userObj) {
      await setItemAsync(USER_KEY, JSON.stringify(userObj));
    }
  } catch (_) {}
};

const loadCachedUser = async () => {
  try {
    const raw = await getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (token, user) => {
    await setItemAsync(TOKEN_KEY, token);
    const normalizedUser = {
      id: user?.id || 1,
      email: user?.email || "",
      fullName: user?.fullName || user?.full_name || user?.email?.split("@")[0] || "Member",
      role: user?.role || "CUSTOMER",
      phone: user?.phone || "",
      loyaltyTier: user?.loyaltyTier || user?.loyalty_tier || "TRYVIA MEMBER",
      walletBalance: user?.walletBalance ?? user?.wallet_balance ?? 0,
      points: user?.points ?? 0,
      tryviaStars: user?.tryviaStars ?? user?.stars ?? 0,
      address: user?.address || null,
      preferences: user?.preferences || {},
    };
    await saveCachedUser(normalizedUser);
    set({ token, user: normalizedUser, isAuthenticated: true });

    // Refresh full profile in background from /auth/me
    try {
      const fullMe = await authService.getMe();
      if (fullMe) {
        set((state) => {
          const updatedUser = {
            ...state.user,
            id: fullMe.id || state.user?.id,
            email: fullMe.email || state.user?.email,
            fullName: fullMe.full_name || state.user?.fullName,
            role: fullMe.role || state.user?.role,
            phone: fullMe.phone || state.user?.phone,
            loyaltyTier: fullMe.loyalty_tier || state.user?.loyaltyTier,
            walletBalance: fullMe.wallet_balance ?? state.user?.walletBalance ?? 0,
            points: fullMe.points ?? state.user?.points ?? 0,
            tryviaStars: fullMe.stars ?? state.user?.tryviaStars ?? 0,
            address: fullMe.address || state.user?.address,
            preferences: fullMe.preferences || state.user?.preferences,
          };
          saveCachedUser(updatedUser);
          return { user: updatedUser };
        });
      }
    } catch (_) {}
  },

  logout: async () => {
    await deleteItemAsync(TOKEN_KEY);
    await deleteItemAsync(USER_KEY);
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
          const status = err?.response?.status;
          // Only drop session if backend explicitly rejected the JWT (401/403).
          // Keep cached session across transient network/Render cold-start errors.
          if (status === 401 || status === 403) {
            await deleteItemAsync(TOKEN_KEY);
            await deleteItemAsync(USER_KEY);
            token = null;
          } else {
            const cachedUser = await loadCachedUser();
            if (cachedUser) {
              set({
                token,
                user: cachedUser,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
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
        await saveCachedUser(frontendUser);
        set({
          token,
          user: frontendUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else if (token) {
        const cachedUser = await loadCachedUser();
        set({
          token,
          user: cachedUser || { id: 1, email: "", fullName: "Member", role: "CUSTOMER", walletBalance: 0, points: 0, tryviaStars: 0, address: null, preferences: {} },
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
    } catch (_e) {
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
      const updatedUser = {
        ...state.user,
        ...updates,
        address: updates.address
          ? { ...state.user.address, ...updates.address }
          : state.user.address,
        preferences: updates.preferences
          ? { ...state.user.preferences, ...updates.preferences }
          : state.user.preferences,
      };
      saveCachedUser(updatedUser);
      return { user: updatedUser };
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

setUnauthorizedHandler(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

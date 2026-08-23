import { create } from 'zustand';
import { setItemAsync, getItemAsync, deleteItemAsync } from '../utils/storage';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface UserPreferences {
  whatsappUpdates: boolean;
  exclusiveInvites: boolean;
  biometrics: boolean;
}

export interface User {
  id: number | string;
  email: string;
  fullName: string;
  phone?: string;
  loyaltyTier: string;
  walletBalance: number;
  points: number;
  tryviaStars: number;
  address?: ShippingAddress | null;
  preferences: UserPreferences;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  addWalletBalance: (amount: number) => void;
  deductWalletBalance: (amount: number) => void;
  addStars: (amount: number) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  whatsappUpdates: true,
  exclusiveInvites: true,
  biometrics: false,
};

const TOKEN_KEY = 'tryvia_jwt_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (token: string, user: User) => {
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
      const { authService } = await import('../api/services/authService');
      
      let user: any = null;

      if (token) {
        try {
          user = await authService.getMe();
        } catch (err: any) {
          await deleteItemAsync(TOKEN_KEY);
          token = null;
        }
      }
      
      if (token && user) {
        const frontendUser: User = {
          id: user.id || 1,
          email: user.email || '',
          fullName: user.full_name || user.email?.split('@')[0] || 'Member',
          phone: user.phone || '',
          loyaltyTier: user.loyalty_tier || 'TRYVIA MEMBER',
          walletBalance: user.wallet_balance ?? 350,
          points: user.points || 0,
          tryviaStars: user.stars || 0,
          address: user.address || null,
          preferences: user.preferences || DEFAULT_PREFERENCES,
        };
        
        set({ token, user: frontendUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: (updates: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          ...updates,
          address: updates.address ? { ...state.user.address, ...updates.address } : state.user.address,
          preferences: updates.preferences ? { ...state.user.preferences, ...updates.preferences } : state.user.preferences,
        },
      };
    });
  },

  addWalletBalance: (amount: number) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          walletBalance: state.user.walletBalance + amount
        }
      };
    });
  },

  deductWalletBalance: (amount: number) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          walletBalance: Math.max(0, state.user.walletBalance - amount)
        }
      };
    });
  },

  addStars: (amount: number) => {
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          tryviaStars: (state.user.tryviaStars || 0) + amount
        }
      };
    });
  }
}));

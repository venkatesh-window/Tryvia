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
  id: number;
  email: string;
  fullName: string;
  phone: string;
  loyaltyTier: string;
  walletBalance: number;
  points: number;
  tryviaStars: number;
  address: ShippingAddress;
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

const DEFAULT_USER: User = {
  id: 1,
  email: 'venkatesh@tryvia.luxury',
  fullName: 'Venkatesh S',
  phone: '+91 98401 23456',
  loyaltyTier: 'TRYVIA BLACK',
  walletBalance: 1400,
  points: 4200,
  tryviaStars: 0,
  address: {
    fullName: 'Venkatesh S',
    street: '42 Altamount Road, Penthouse B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400026',
    phone: '+91 98401 23456',
  },
  preferences: {
    whatsappUpdates: true,
    exclusiveInvites: true,
    biometrics: false,
  },
};

const TOKEN_KEY = 'tryvia_jwt_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: 'mock_token_tryvia',
  user: DEFAULT_USER,
  isAuthenticated: true,
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
          // Token was invalid / expired / from old backend -> clear it
          await deleteItemAsync(TOKEN_KEY);
          token = null;
        }
      }

      // If no valid token, perform auto-login for seeded test user
      if (!token) {
        try {
          const loginRes = await authService.login({ username: 'test@tryvia.com', password: 'password123' });
          token = loginRes.access_token;
          await setItemAsync(TOKEN_KEY, token);
          user = await authService.getMe();
        } catch (loginErr) {
          // Server might be offline or initializing
          user = null;
        }
      }
      
      if (token && user) {
        const frontendUser: User = {
          id: user.id || 1,
          email: user.email || 'test@tryvia.com',
          fullName: user.full_name || 'Tester User',
          phone: '+91 98401 23456',
          loyaltyTier: user.loyalty_tier || 'TRYVIA BLACK',
          walletBalance: user.wallet_balance ?? 350,
          points: user.points || 0,
          tryviaStars: user.stars || 0,
          address: DEFAULT_USER.address,
          preferences: DEFAULT_USER.preferences,
        };
        
        set({ token, user: frontendUser, isAuthenticated: true, isLoading: false });
      } else {
        // Fallback to default user if offline so app remains usable
        set({ token: 'offline_token', user: DEFAULT_USER, isAuthenticated: true, isLoading: false });
      }
    } catch (e) {
      set({ token: 'offline_token', user: DEFAULT_USER, isAuthenticated: true, isLoading: false });
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

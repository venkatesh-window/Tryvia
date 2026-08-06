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
}

const DEFAULT_USER: User = {
  id: 1,
  email: 'venkatesh@tryvia.luxury',
  fullName: 'Venkatesh S',
  phone: '+91 98401 23456',
  loyaltyTier: 'TRYVIA BLACK',
  walletBalance: 1400,
  points: 4200,
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
      const token = await getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, user: DEFAULT_USER, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: 'mock_token', user: DEFAULT_USER, isAuthenticated: true, isLoading: false });
      }
    } catch (e) {
      console.error('Failed to restore token', e);
      set({ token: 'mock_token', user: DEFAULT_USER, isAuthenticated: true, isLoading: false });
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
  }
}));

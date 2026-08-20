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
      
      // Auto-login the seeded user if no token
      if (!token) {
        const { authService } = await import('../api/services/authService');
        const loginRes = await authService.login({ username: 'test@tryvia.com', password: 'password123' });
        token = loginRes.access_token;
        await setItemAsync(TOKEN_KEY, token);
      }
      
      if (token) {
        const { authService } = await import('../api/services/authService');
        const user = await authService.getMe();
        
        // Map backend user to frontend user format
        const frontendUser: User = {
          id: user.id,
          email: user.email,
          fullName: user.full_name || 'Tester User',
          phone: '+91 98401 23456', // Mock address for now as the backend user doesn't have an address table
          loyaltyTier: user.loyalty_tier || 'BRONZE',
          walletBalance: user.wallet_balance || 0,
          points: user.points || 0,
          tryviaStars: 0,
          address: DEFAULT_USER.address,
          preferences: DEFAULT_USER.preferences,
        };
        
        set({ token, user: frontendUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      console.error('Failed to restore token', e);
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

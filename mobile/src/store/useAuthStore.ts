import { create } from 'zustand';
import { setItemAsync, getItemAsync, deleteItemAsync } from '../utils/storage';

interface User {
  id: number;
  email: string;
  fullName: string;
  loyaltyTier: string;
  walletBalance: number;
  points: number;
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
  addWalletBalance: (amount: number) => void;
  deductWalletBalance: (amount: number) => void;
}

const TOKEN_KEY = 'tryvia_jwt_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

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
        // Here we would typically validate the token or fetch the user profile from the backend
        // For now, we simulate success if the token exists locally
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      console.error('Failed to restore token', e);
      set({ token: null, isAuthenticated: false, isLoading: false });
    }
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

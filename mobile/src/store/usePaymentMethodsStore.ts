import { create } from 'zustand';

export interface SavedCard {
  id: string;
  type: 'card';
  cardholderName: string;
  cardNumberMasked: string;
  expiry: string;
  cardBrand: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
}

export interface SavedUpi {
  id: string;
  type: 'upi';
  upiId: string;
  appLabel: string;
  isDefault: boolean;
}

export type PaymentMethodItem = SavedCard | SavedUpi;

interface PaymentMethodsState {
  methods: PaymentMethodItem[];
  addCard: (card: Omit<SavedCard, 'id' | 'type'>) => void;
  addUpi: (upi: Omit<SavedUpi, 'id' | 'type'>) => void;
  removeMethod: (id: string) => void;
  setDefaultMethod: (id: string) => void;
}

export const usePaymentMethodsStore = create<PaymentMethodsState>((set) => ({
  methods: [],

  addCard: (card) => {
    const newCard: SavedCard = {
      ...card,
      id: `pm-card-${Date.now()}`,
      type: 'card',
    };
    set((state) => {
      let updated = state.methods;
      if (newCard.isDefault) {
        updated = updated.map(m => ({ ...m, isDefault: false }));
      }
      return { methods: [newCard, ...updated] };
    });
  },

  addUpi: (upi) => {
    const newUpi: SavedUpi = {
      ...upi,
      id: `pm-upi-${Date.now()}`,
      type: 'upi',
    };
    set((state) => {
      let updated = state.methods;
      if (newUpi.isDefault) {
        updated = updated.map(m => ({ ...m, isDefault: false }));
      }
      return { methods: [newUpi, ...updated] };
    });
  },

  removeMethod: (id: string) => {
    set((state) => ({
      methods: state.methods.filter(m => m.id !== id),
    }));
  },

  setDefaultMethod: (id: string) => {
    set((state) => ({
      methods: state.methods.map(m => ({
        ...m,
        isDefault: m.id === id,
      })),
    }));
  },
}));

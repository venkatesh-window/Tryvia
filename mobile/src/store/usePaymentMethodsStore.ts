import { create } from 'zustand';

export interface SavedCard {
  id: string;
  type: 'card';
  cardholderName: string;
  cardNumberMasked: string; // e.g. "•••• 4242"
  expiry: string; // e.g. "09/28"
  cardBrand: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
}

export interface SavedUpi {
  id: string;
  type: 'upi';
  upiId: string; // e.g. "luxury.member@okhdfcbank"
  appLabel: string; // e.g. "Google Pay"
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

const INITIAL_METHODS: PaymentMethodItem[] = [
  {
    id: 'pm-card-1',
    type: 'card',
    cardholderName: 'Venkatesh S',
    cardNumberMasked: '•••• 4242',
    expiry: '11/29',
    cardBrand: 'visa',
    isDefault: true,
  },
  {
    id: 'pm-card-2',
    type: 'card',
    cardholderName: 'Venkatesh S',
    cardNumberMasked: '•••• 8800',
    expiry: '04/28',
    cardBrand: 'amex',
    isDefault: false,
  },
  {
    id: 'pm-upi-1',
    type: 'upi',
    upiId: 'venkatesh@okhdfcbank',
    appLabel: 'Google Pay',
    isDefault: false,
  },
];

export const usePaymentMethodsStore = create<PaymentMethodsState>((set) => ({
  methods: INITIAL_METHODS,

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

import { create } from "zustand";

export const usePaymentMethodsStore = create((set) => ({
  methods: [],

  addCard: (card) => {
    const newCard = {
      ...card,
      id: `pm-card-${Date.now()}`,
      type: "card",
    };
    set((state) => {
      let updated = state.methods;
      if (newCard.isDefault) {
        updated = updated.map((m) => ({ ...m, isDefault: false }));
      }
      return { methods: [newCard, ...updated] };
    });
  },

  addUpi: (upi) => {
    const newUpi = {
      ...upi,
      id: `pm-upi-${Date.now()}`,
      type: "upi",
    };
    set((state) => {
      let updated = state.methods;
      if (newUpi.isDefault) {
        updated = updated.map((m) => ({ ...m, isDefault: false }));
      }
      return { methods: [newUpi, ...updated] };
    });
  },

  removeMethod: (id) => {
    set((state) => ({
      methods: state.methods.filter((m) => m.id !== id),
    }));
  },

  setDefaultMethod: (id) => {
    set((state) => ({
      methods: state.methods.map((m) => ({
        ...m,
        isDefault: m.id === id,
      })),
    }));
  },
}));

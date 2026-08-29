import { apiClient as client } from "../client";

export const walletService = {
  async getBalance() {
    const response = await client.get("/wallet/balance");
    return response.data;
  },

  async checkEligibility(productId) {
    const response = await client.get(`/wallet/eligibility/${productId}`);
    return response.data;
  },

  async calculateCheckout(items, useWallet) {
    const response = await client.post("/payments/checkout/calculate", {
      items,
      use_wallet: useWallet,
    });
    return response.data;
  }
};

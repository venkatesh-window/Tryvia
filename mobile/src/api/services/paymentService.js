import { apiClient as client, getBaseUrl } from "../client";

export const paymentService = {
  async getPaymentConfig() {
    const response = await client.get("/payments/config");
    return response.data;
  },

  async createPaymentOrder(data) {
    const response = await client.post("/payments/create-order", data);
    return response.data;
  },

  async verifyPayment(data) {
    const response = await client.post("/payments/verify", data);
    return response.data;
  },

  getCheckoutSessionUrl(orderId, token, callbackUrl) {
    const base = getBaseUrl();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const callbackParam = callbackUrl
      ? `${token ? "&" : "?"}callback_url=${encodeURIComponent(callbackUrl)}`
      : "";
    return `${base}/payments/checkout-session/${orderId}${tokenParam}${callbackParam}`;
  },
};

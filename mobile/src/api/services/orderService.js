import { apiClient as client } from "../client";

export const orderService = {
  async createOrder(data) {
    const response = await client.post("/orders/", data);
    return response.data;
  },

  async getOrders() {
    const response = await client.get("/orders/");
    return response.data;
  },
};

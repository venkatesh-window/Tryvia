import { apiClient as client } from '../client';

export interface OrderItemInput {
  product_id: number;
  item_type: 'full' | 'tester';
  quantity: number;
  unit_price: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  payment_method?: string;
  apply_wallet_credit_id?: number | null;
  shipping_address?: string | null;
}

export interface OrderResponse {
  id: number;
  subtotal: number;
  wallet_discount: number;
  platform_fee: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  shipping_address?: string;
  created_at: string;
  items: any[];
}

export const orderService = {
  async createOrder(data: CreateOrderInput): Promise<OrderResponse> {
    const response = await client.post('/orders/', data);
    return response.data;
  },

  async getOrders(): Promise<OrderResponse[]> {
    const response = await client.get('/orders/');
    return response.data;
  }
};

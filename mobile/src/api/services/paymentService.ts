import { apiClient as client, getBaseUrl } from '../client';
import { OrderItemInput, OrderResponse } from './orderService';

export interface CreatePaymentOrderInput {
  items: OrderItemInput[];
  apply_wallet_credit_id?: number | null;
  shipping_address?: string | null;
}

export interface RazorpayOrderResponse {
  success: boolean;
  is_zero_amount?: boolean;
  razorpay_order_id?: string;
  amount?: number;
  currency?: string;
  key_id?: string;
  order_id: number;
  order_db_id: string;
  order?: OrderResponse;
  customer?: {
    name: string;
    email: string;
    contact?: string;
  };
  message?: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: number | string;
  payment_instrument?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order: OrderResponse;
}

export interface PaymentConfigResponse {
  key_id: string;
  currency: string;
}

export const paymentService = {
  async getPaymentConfig(): Promise<PaymentConfigResponse> {
    const response = await client.get('/payments/config');
    return response.data;
  },

  async createPaymentOrder(data: CreatePaymentOrderInput): Promise<RazorpayOrderResponse> {
    const response = await client.post('/payments/create-order', data);
    return response.data;
  },

  async verifyPayment(data: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
    const response = await client.post('/payments/verify', data);
    return response.data;
  },

  getCheckoutSessionUrl(orderId: number | string): string {
    const base = getBaseUrl();
    return `${base}/payments/checkout-session/${orderId}`;
  },
};

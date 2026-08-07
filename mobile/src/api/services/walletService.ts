import { apiClient as client } from '../client';

export interface WalletCredit {
  id: number;
  eligible_product_id: number;
  original_amount: number;
  redeemable_amount: number;
  platform_fee: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiry_date: string;
}

export interface WalletBalanceSummary {
  total_balance: number;
  active_credits: WalletCredit[];
  used_credits: WalletCredit[];
  expired_credits: WalletCredit[];
}

export interface WalletEligibility {
  eligible: boolean;
  credit: WalletCredit | null;
}

export const walletService = {
  async getBalance(): Promise<WalletBalanceSummary> {
    const response = await client.get('/wallet/balance');
    return response.data;
  },

  async checkEligibility(productId: number): Promise<WalletEligibility> {
    const response = await client.get(`/wallet/eligibility/${productId}`);
    return response.data;
  }
};

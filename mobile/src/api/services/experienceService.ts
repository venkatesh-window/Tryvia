import { apiClient as client } from '../client';

export interface Experience {
  id: number;
  order_item_id: number;
  product_id: number;
  status: 'PENDING' | 'EXPERIENCED';
  experienced_at: string | null;
}

export const experienceService = {
  async getExperiences(): Promise<Experience[]> {
    const response = await client.get('/experiences/');
    return response.data;
  },

  async markExperienced(experienceId: number): Promise<{ message: string }> {
    const response = await client.post(`/experiences/${experienceId}/mark-experienced`);
    return response.data;
  },

  async addReview(experienceId: number, rating: number, content: string): Promise<{ message: string }> {
    const response = await client.post(`/experiences/${experienceId}/review`, {
      rating,
      content,
    });
    return response.data;
  }
};

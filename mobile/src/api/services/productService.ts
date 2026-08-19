import { apiClient } from '../client';
import { Product, ProductListSchema, ProductSchema } from '../schemas/product';

export const productService = {
  getProducts: async (limit: number = 10, search?: string, category_id?: number): Promise<Product[]> => {
    let url = `/products?limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category_id) url += `&category_id=${category_id}`;
    
    const response = await apiClient.get(url);
    return ProductListSchema.parse(response.data);
  },

  getTrendingTesters: async (limit: number = 10): Promise<Product[]> => {
    const response = await apiClient.get(`/products/testers?limit=${limit}`);
    return ProductListSchema.parse(response.data);
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return ProductSchema.parse(response.data);
  }
};

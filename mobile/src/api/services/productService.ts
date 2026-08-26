import { apiClient } from '../client';
import { Product, ProductListSchema, ProductSchema } from '../schemas/product';
import { INITIAL_PRODUCTS, getFallbackProduct } from '../../constants/products';

export const productService = {
  getProducts: async (limit: number = 10, search?: string, category_id?: number): Promise<Product[]> => {
    try {
      let url = `/products?limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category_id) url += `&category_id=${category_id}`;
      
      const response = await apiClient.get(url);
      const parsed = ProductListSchema.parse(response.data);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Backend product fetch notice, using catalog fallback');
    }
    return INITIAL_PRODUCTS;
  },

  getTrendingTesters: async (limit: number = 10): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/products/testers?limit=${limit}`);
      const parsed = ProductListSchema.parse(response.data);
      if (parsed && parsed.length > 0) return parsed;
    } catch (e) {
      // fallback
    }
    return INITIAL_PRODUCTS.filter(p => (p.stock_tester || 0) > 0);
  },

  getProductById: async (id: number | string): Promise<Product> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      const parsed = ProductSchema.parse(response.data);
      if (parsed && parsed.id) return parsed;
    } catch (e) {
      console.warn(`Product ${id} fetch fallback`);
    }
    const fallback = getFallbackProduct(id);
    if (fallback) return fallback;
    throw new Error('Product not found');
  }
};

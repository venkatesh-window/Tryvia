import { apiClient } from '../client';
import { Product, ProductListSchema, ProductSchema } from '../schemas/product';

// Fallback data when API is down (DB missing)
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Midnight Recovery Cloud Cream',
    full_price: 5200,
    tester_price: 350,
    stock_full: 100,
    stock_tester: 50,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
    description: 'A luxurious, lightweight cream that visibly plumps and smooths your skin while you sleep. Formulated with our signature botanical blend to restore radiance overnight.',
    brand: { id: 1, name: 'Kiehls' }
  },
  {
    id: 2,
    name: 'Baccarat Rouge 540',
    full_price: 28500,
    tester_price: 950,
    stock_full: 20,
    stock_tester: 100,
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
    description: 'Luminous and sophisticated, Baccarat Rouge 540 lays on the skin like an amber floral and woody breeze.',
    brand: { id: 2, name: 'Maison Francis Kurkdjian' }
  },
  {
    id: 3,
    name: 'Advanced Night Repair',
    full_price: 8900,
    tester_price: 450,
    stock_full: 80,
    stock_tester: 200,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop',
    description: 'The #1 serum in the US. Experience the power of 7 serums in 1: line reduction, firmness, even tone, strengthening, hydration, radiance, and antioxidants.',
    brand: { id: 3, name: 'Estee Lauder' }
  }
];

export const productService = {
  getProducts: async (limit: number = 10): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/products?limit=${limit}`);
      return ProductListSchema.parse(response.data);
    } catch (error) {
      console.warn('Backend unavailable or failed. Falling back to MOCK_PRODUCTS.');
      return MOCK_PRODUCTS.slice(0, limit);
    }
  },
  getTrendingTesters: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/products?limit=10');
      return ProductListSchema.parse(response.data);
    } catch (error) {
      console.warn('Backend unavailable or failed. Falling back to MOCK_PRODUCTS.');
      return MOCK_PRODUCTS;
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return ProductSchema.parse(response.data);
    } catch (error) {
      console.warn(`Backend unavailable for product ${id}. Falling back to mock.`);
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  }
};

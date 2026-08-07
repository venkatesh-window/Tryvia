import { apiClient } from '../client';
import { Product, ProductListSchema, ProductSchema } from '../schemas/product';

// Fallback data when API is down or network disconnects
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
    brand: { id: 1, name: 'Kiehls' },
    category: { id: 1, name: 'Skincare' }
  },
  {
    id: 2,
    name: 'Baccarat Rouge 540',
    full_price: 28500,
    tester_price: 950,
    stock_full: 20,
    stock_tester: 100,
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
    description: 'Luminous and sophisticated, Baccarat Rouge 540 lays on the skin like an amber floral and woody breeze. A poetic alchemy where aerial notes carry woody tones of freshly cut cedar wood.',
    brand: { id: 2, name: 'Maison Francis Kurkdjian' },
    category: { id: 2, name: 'Fragrance' }
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
    brand: { id: 3, name: 'Estee Lauder' },
    category: { id: 1, name: 'Skincare' }
  },
  {
    id: 4,
    name: 'Olaplex No.7 Bonding Oil',
    full_price: 3200,
    tester_price: 250,
    stock_full: 150,
    stock_tester: 0,
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop',
    description: 'A highly-concentrated, weightless reparative styling oil. Dramatically increases shine, softness, and color vibrancy while minimizing flyaways and frizz.',
    brand: { id: 4, name: 'Olaplex' },
    category: { id: 3, name: 'Haircare' }
  },
  {
    id: 5,
    name: 'Dior Addict Lip Glow',
    full_price: 3800,
    tester_price: 300,
    stock_full: 60,
    stock_tester: 150,
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=600&auto=format&fit=crop',
    description: 'The iconic Dior lip balm formulated with 97% natural-origin ingredients that subtly revives the natural color of lips with a custom glow for 6h and hydrates lips for 24h.',
    brand: { id: 5, name: 'Dior Beauty' },
    category: { id: 4, name: 'Makeup' }
  }
];

export const productService = {
  getProducts: async (limit: number = 10): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/products?limit=${limit}`);
      return ProductListSchema.parse(response.data);
    } catch (error) {
      console.log('Fetching live backend products failed, using mock data.');
      return MOCK_PRODUCTS.slice(0, limit);
    }
  },

  getTrendingTesters: async (limit: number = 10): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/products/testers?limit=${limit}`);
      return ProductListSchema.parse(response.data);
    } catch (error) {
      console.log('Fetching live backend testers failed, using mock data.');
      return MOCK_PRODUCTS.filter(p => p.stock_tester > 0).slice(0, limit);
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return ProductSchema.parse(response.data);
    } catch (error) {
      console.log(`Fetching backend product ${id} failed, using mock fallback.`);
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  }
};

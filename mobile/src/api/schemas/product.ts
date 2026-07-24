import { z } from 'zod';

export const BrandSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  full_price: z.number(),
  tester_price: z.number(),
  stock_full: z.number(),
  stock_tester: z.number(),
  image_url: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  brand_id: z.number().nullable().optional(),
  
  // Relations
  brand: BrandSchema.optional(),
  category: CategorySchema.optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

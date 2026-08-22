import { z } from 'zod';

export const BrandSchema = z.object({
  id: z.any().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const CategorySchema = z.object({
  id: z.any().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const ProductSchema = z.object({
  id: z.any(),
  name: z.string(),
  description: z.string().nullable().optional(),
  full_price: z.coerce.number().default(0),
  tester_price: z.coerce.number().default(0),
  stock_full: z.coerce.number().default(10),
  stock_tester: z.coerce.number().default(10),
  image_url: z.string().nullable().optional(),
  category_id: z.any().nullable().optional(),
  brand_id: z.any().nullable().optional(),
  
  // Relations
  brand: BrandSchema.optional(),
  category: CategorySchema.optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

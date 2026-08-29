import { z } from "zod";

// Define schemas that strictly mirror our FastAPI Pydantic models

export const UserSchema = z.object({
  id: z.number().or(z.string()),
  email: z.string().email(),
  full_name: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  is_superuser: z.boolean().optional(),
  wallet_balance: z.number().default(0),
  loyalty_tier: z.string().default("BRONZE"),
  points: z.number().default(0),
  role: z.string().optional(),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
});

export const LoginPayloadSchema = z.object({
  username: z.string().email(),
  password: z.string().min(1),
});

export const RegisterPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  full_name: z.string().optional(),
});

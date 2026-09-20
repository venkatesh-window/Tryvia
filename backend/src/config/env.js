import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("8000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

export const validateEnv = () => {
  try {
    // We don't want to enforce everything in dev if it's missing, but we MUST enforce JWT_SECRET and ADMIN_PASSWORD.
    envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment variables:");
    console.error(error.errors);
    process.exit(1);
  }
};

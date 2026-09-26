import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

// Helper to enforce production strings without breaking local dev defaults
const prodRequired = (devDefault: string) =>
  isProduction ? z.string().min(1) : z.string().default(devDefault);

const prodOptional = () =>
  isProduction ? z.string().min(1) : z.string().optional();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: prodRequired('ahankara_boutique_v3_super_secret_key_32bytes'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  // Resend
  RESEND_API_KEY: prodOptional(),
  AUTH_EMAIL_FROM: z.string().default('Ahankara Studios <onboarding@resend.dev>'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: prodOptional(),
  CLOUDINARY_API_KEY: prodOptional(),
  CLOUDINARY_API_SECRET: prodOptional(),

  // Razorpay
  RAZORPAY_KEY_ID: prodRequired('rzp_test_placeholder'),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, 'NEXT_PUBLIC_RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: prodRequired('placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: prodRequired('placeholder_webhook'),

  // Shiprocket
  SHIPROCKET_EMAIL: prodOptional(),
  SHIPROCKET_PASSWORD: prodOptional(),
  SHIPROCKET_PICKUP_LOCATION: z.string().min(1, 'SHIPROCKET_PICKUP_LOCATION is required'),
  SHIPROCKET_WEBHOOK_SECRET: prodOptional(),
});

export const env = (() => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:', error.flatten().fieldErrors);
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
})();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16).default('ahankara_boutique_v3_super_secret_key_32bytes'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().optional(),
  AUTH_EMAIL_FROM: z.string().default('Ahankara Boutique <onboarding@resend.dev>'),
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

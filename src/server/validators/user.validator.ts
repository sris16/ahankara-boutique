import { z } from 'zod';

// Normalize email (lowercase, trim)
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address');

// Simple phone validation (basic format, can be extended for strict E.164)
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[0-9]+$/, 'Phone number must contain only numbers and an optional leading +');

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, 'Name is required').optional(),
  phone: phoneSchema.optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').optional(),
  phone: phoneSchema.optional().or(z.literal('')),
});

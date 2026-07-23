import { z } from 'zod';

export const addToCartSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(999, "Quantity too high"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(999, "Quantity too high"),
});

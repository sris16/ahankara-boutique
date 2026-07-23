import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
});

export const moveToCartSchema = z.object({
  variantId: z.string().uuid().optional(), // Required if product has multiple variants, optional if exact 1
  quantity: z.number().int().min(1).max(999).default(1),
});

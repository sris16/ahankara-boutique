import { z } from 'zod';

export const adjustStockSchema = z.object({
  delta: z.number().int('Delta must be an integer'),
  reason: z.string().optional(),
  reference: z.string().optional()
});

export const reserveStockSchema = z.object({
  quantity: z.number().int().min(1, 'Reservation quantity must be at least 1'),
  reference: z.string().optional()
});

export const commitStockSchema = z.object({
  quantity: z.number().int().min(1, 'Commit quantity must be at least 1'),
  reference: z.string().optional()
});

export const releaseStockSchema = z.object({
  quantity: z.number().int().min(1, 'Release quantity must be at least 1'),
  reference: z.string().optional()
});

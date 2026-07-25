import { z } from 'zod';
import { ReturnReason } from '@prisma/client';

export const createReturnRequestSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    reason: z.nativeEnum(ReturnReason),
  })).min(1, "At least one item must be returned"),
  customerNote: z.string().max(1000).optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED']),
  adminNote: z.string().max(1000).optional(),
});

export const inspectReturnItemSchema = z.object({
  acceptedQuantity: z.number().int().min(0),
  condition: z.string().optional(),
  resolution: z.string().optional()
});

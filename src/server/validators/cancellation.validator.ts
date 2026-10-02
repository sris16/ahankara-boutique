import { z } from 'zod';


export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500).optional(),
  note: z.string().max(1000).optional()});

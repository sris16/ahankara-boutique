import { z } from 'zod';
import { CouponType } from '@prisma/client';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(CouponType),
  value: z.number().int().positive(),
  minimumOrderAmount: z.number().int().min(0).default(0),
  maximumDiscountAmount: z.number().int().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  usageLimitPerUser: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
}).refine(data => {
  if (data.startsAt && data.endsAt) {
    return data.startsAt < data.endsAt;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endsAt"]
}).refine(data => {
  if (data.type === CouponType.PERCENTAGE) {
    return data.value <= 100;
  }
  return true;
}, {
  message: "Percentage value cannot exceed 100",
  path: ["value"]
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/).optional(),
});

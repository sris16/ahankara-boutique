import { z } from 'zod';

export const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
});

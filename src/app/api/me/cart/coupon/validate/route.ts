
import { AuthService } from '@/server/services/auth.service';
import { PricingService } from '@/server/services/pricing.service';

import { z } from 'zod';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

const validateCouponSchema = z.object({
  code: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const user = await AuthService.requireAuth(request.headers);

    const body = await request.json();
    const validated = validateCouponSchema.parse(body);

    const pricing = await PricingService.calculateCheckoutPricing(user.id, validated.code);

    return successResponse({
      subtotal: pricing.subtotal,
      eligibleSubtotal: pricing.eligibleSubtotal,
      discountAmount: pricing.discountAmount,
      discountedSubtotal: pricing.discountedSubtotal,
      shippingAmount: pricing.shippingAmount,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      coupon: pricing.coupon
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { PricingService } from '@/server/services/pricing.service';
import { AppError } from '@/utils/errors';
import { z } from 'zod';

const validateCouponSchema = z.object({
  code: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const user = await AuthService.requireUser(request.headers);

    const body = await request.json();
    const validated = validateCouponSchema.parse(body);

    const pricing = await PricingService.calculateCheckoutPricing(user.id, validated.code);

    return NextResponse.json({
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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { PricingService } from '@/server/services/pricing.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const searchParams = req.nextUrl.searchParams;
    const addressId = searchParams.get('addressId') || undefined;
    const couponCode = searchParams.get('couponCode') || undefined;

    const pricing = await PricingService.calculateCheckoutPricing(
      user.id,
      couponCode,
      addressId
    );

    return successResponse(pricing);
  } catch (error) {
    return handleError(error);
  }
}

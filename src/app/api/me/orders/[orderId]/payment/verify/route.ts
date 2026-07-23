import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { PaymentService } from '@/server/services/payment.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';
import { z } from 'zod';
import { ValidationError } from '@/utils/errors';

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Missing payment verification fields');
    }

    const order = await PaymentService.verifyCheckoutPayment(
      user.id,
      orderId,
      parsed.data.razorpayOrderId,
      parsed.data.razorpayPaymentId,
      parsed.data.razorpaySignature
    );
    
    return successResponse(order);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { PaymentService } from '@/server/services/payment.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    
    const payment = await PaymentService.createPaymentAttempt(user.id, orderId);
    return successResponse(payment);
  } catch (error) {
    return handleError(error);
  }
}

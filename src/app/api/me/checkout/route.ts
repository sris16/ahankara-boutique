import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    
    const idempotencyKey = req.headers.get('idempotency-key');
    if (!idempotencyKey) {
      throw new Error('Idempotency-Key header is required');
    }

    const order = await OrderService.createCheckoutOrder(user.id, body, idempotencyKey);
    return successResponse(order, undefined, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'Idempotency-Key header is required') {
      return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    return handleError(error);
  }
}

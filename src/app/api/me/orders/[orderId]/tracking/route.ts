import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { AppError } from '@/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await AuthService.requireAuth(request.headers);

    const trackingResponse = await OrderService.getCustomerOrderTracking(user.id, resolvedParams.orderId);

    return NextResponse.json(trackingResponse);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Get order tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

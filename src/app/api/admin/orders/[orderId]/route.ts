import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    AuthService.requireRole(user, 'ADMIN');
    
    const order = await OrderService.getAdminOrderById(orderId);
    return successResponse(order);
  } catch (error) {
    return handleError(error);
  }
}

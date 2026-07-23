import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await OrderService.getCustomerOrders(user.id, page, limit);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

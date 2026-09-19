import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, 'ADMIN');

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await OrderService.getAllOrders(page, limit);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

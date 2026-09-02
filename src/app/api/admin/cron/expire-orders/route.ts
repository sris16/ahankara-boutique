import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { OrderService } from '@/server/services/order.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    
    await OrderService.expirePendingOrders();
    
    return successResponse({ message: 'Successfully executed pending order expiration' }, 'Cron job completed', 200);
  } catch (error) {
    return handleError(error);
  }
}

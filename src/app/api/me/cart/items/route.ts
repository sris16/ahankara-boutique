import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CartService } from '@/server/services/cart.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    const cart = await CartService.addItem(user.id, body);
    return successResponse(cart, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CartService } from '@/server/services/cart.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const cart = await CartService.getOrCreateCart(user.id);
    return successResponse(cart);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    await CartService.clearCart(user.id);
    return successResponse({ success: true, message: 'Cart cleared' });
  } catch (error) {
    return handleError(error);
  }
}

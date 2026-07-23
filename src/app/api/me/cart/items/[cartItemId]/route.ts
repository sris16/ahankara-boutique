import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CartService } from '@/server/services/cart.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    const { cartItemId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    const cart = await CartService.updateItemQuantity(user.id, cartItemId, body);
    return successResponse(cart);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ cartItemId: string }> }) {
  try {
    const { cartItemId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    await CartService.removeItem(user.id, cartItemId);
    return successResponse({ success: true, message: 'Item removed' });
  } catch (error) {
    return handleError(error);
  }
}

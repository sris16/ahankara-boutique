import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { WishlistService } from '@/server/services/wishlist.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const wishlist = await WishlistService.getWishlist(user.id);
    return successResponse(wishlist);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    const result = await WishlistService.addProduct(user.id, body);
    return successResponse(result, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

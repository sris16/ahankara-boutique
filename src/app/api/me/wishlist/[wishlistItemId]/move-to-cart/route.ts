import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { WishlistService } from '@/server/services/wishlist.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest, { params }: { params: Promise<{ wishlistItemId: string }> }) {
  try {
    const { wishlistItemId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    
    // Parse body if present, else empty obj
    let body = {};
    try {
      body = await req.json();
    } catch {
      // ignore
    }

    await WishlistService.moveToCart(user.id, wishlistItemId, body);
    return successResponse({ success: true, message: 'Moved to cart' });
  } catch (error) {
    return handleError(error);
  }
}

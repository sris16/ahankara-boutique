import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { WishlistService } from '@/server/services/wishlist.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ wishlistItemId: string }> }) {
  try {
    const { wishlistItemId } = await params;
    const user = await AuthService.requireAuth(req.headers);
    await WishlistService.removeProduct(user.id, wishlistItemId);
    return successResponse({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    return handleError(error);
  }
}

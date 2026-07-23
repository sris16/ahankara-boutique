import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductImageService } from '@/server/services/product-image.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    const body = await req.json();
    
    await ProductImageService.reorderImages(productId, body);
    return successResponse({ message: 'Images reordered successfully' });
  } catch (error) {
    return handleError(error);
  }
}

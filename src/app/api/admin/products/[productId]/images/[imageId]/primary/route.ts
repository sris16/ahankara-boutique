import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductImageService } from '@/server/services/product-image.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string, imageId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, imageId } = await params;
    
    const image = await ProductImageService.setPrimaryImage(productId, imageId);
    return successResponse(image);
  } catch (error) {
    return handleError(error);
  }
}

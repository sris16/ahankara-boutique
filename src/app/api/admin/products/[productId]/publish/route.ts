import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductService } from '@/server/services/product.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    const product = await ProductService.publishProduct(productId);
    return successResponse(product);
  } catch (error) {
    return handleError(error);
  }
}

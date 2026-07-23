import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductVariantService } from '@/server/services/product-variant.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string; variantId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, variantId } = await params;
    const variant = await ProductVariantService.getVariantById(productId, variantId);
    return successResponse(variant);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string; variantId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, variantId } = await params;
    const data = await req.json();
    const variant = await ProductVariantService.updateVariant(productId, variantId, data);
    return successResponse(variant);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productId: string; variantId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, variantId } = await params;
    await ProductVariantService.deleteVariant(productId, variantId);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}

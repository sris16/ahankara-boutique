import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductVariantService } from '@/server/services/product-variant.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    const variants = await ProductVariantService.getVariantsByProductId(productId);
    return successResponse(variants);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    const data = await req.json();
    const variant = await ProductVariantService.createVariant(productId, data);
    return successResponse(variant, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

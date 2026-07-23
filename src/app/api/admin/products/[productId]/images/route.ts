import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductImageService } from '@/server/services/product-image.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';
import { ValidationError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    });
    
    return successResponse(images);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId } = await params;
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      throw new ValidationError('File is required in formData under key "file"');
    }

    const image = await ProductImageService.uploadImage(productId, file);
    return successResponse(image, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

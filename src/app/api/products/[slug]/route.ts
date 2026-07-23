import { NextRequest } from 'next/server';
import { ProductService } from '@/server/services/product.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await ProductService.getProductBySlug(slug, true);
    return successResponse(product);
  } catch (error) {
    return handleError(error);
  }
}

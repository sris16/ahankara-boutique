import { NextRequest } from 'next/server';
import { ProductService } from '@/server/services/product.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const products = await ProductService.getPublicProducts(query);
    return successResponse(products);
  } catch (error) {
    return handleError(error);
  }
}

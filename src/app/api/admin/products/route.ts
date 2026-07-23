import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ProductService } from '@/server/services/product.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const body = await req.json();
    const product = await ProductService.createProduct(body);
    return successResponse(product, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    const products = await ProductService.getAdminProducts(query);
    return successResponse(products);
  } catch (error) {
    return handleError(error);
  }
}

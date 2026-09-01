import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/server/services/category.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isTree = searchParams.get('tree') === 'true';

    if (isTree) {
      const tree = await CategoryService.getCategoryTree(true);
      return successResponse(tree);
    }

    const categories = await CategoryService.getCategories(true);
    return successResponse(categories);
  } catch (error) {
    return handleError(error);
  }
}

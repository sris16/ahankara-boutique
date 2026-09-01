import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CategoryService } from '@/server/services/category.service';
import { createCategorySchema } from '@/server/validators/category.validator';
import { generateSlug } from '@/utils/slug';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, 'ADMIN');
    
    const body = await req.json();
    if (body.name && !body.slug) {
      body.slug = generateSlug(body.name);
    }

    const data = createCategorySchema.parse(body);
    const category = await CategoryService.createCategory(data);

    return successResponse(category, 'Category created successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, 'ADMIN');
    
    const searchParams = req.nextUrl.searchParams;
    const isTree = searchParams.get('tree') === 'true';

    if (isTree) {
      const tree = await CategoryService.getCategoryTree(false);
      return successResponse(tree);
    }

    const categories = await CategoryService.getCategories(false);
    return successResponse(categories);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CategoryService } from '@/server/services/category.service';
import { updateCategorySchema } from '@/server/validators/category.validator';
import { generateSlug } from '@/utils/slug';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

interface RouteContext {
  params: Promise<{ categoryId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');
    const category = await CategoryService.getCategoryById(categoryId, false);
    return successResponse(category);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');
    
    const body = await req.json();
    
    // Auto-generate slug if name is updated but slug isn't explicitly provided
    if (body.name && !body.slug) {
      body.slug = generateSlug(body.name);
    } else if (body.slug) {
      body.slug = generateSlug(body.slug);
    }

    const data = updateCategorySchema.parse(body);
    const category = await CategoryService.updateCategory(categoryId, data);

    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { categoryId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');
    await CategoryService.deleteCategory(categoryId);
    return successResponse(null, 'Category deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { CategoryService } from '@/server/services/category.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const category = await CategoryService.getCategoryBySlug(slug, true);
    return NextResponse.json(successResponse(category));
  } catch (error) {
    return handleError(error);
  }
}

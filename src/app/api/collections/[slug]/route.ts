import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/server/services/collection.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const collection = await CollectionService.getCollectionBySlug(slug, true);
    return successResponse(collection);
  } catch (error) {
    return handleError(error);
  }
}

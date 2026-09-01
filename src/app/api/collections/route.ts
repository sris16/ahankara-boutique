import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/server/services/collection.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isFeatured = searchParams.get('featured') === 'true';

    const collections = await CollectionService.getCollections(true, isFeatured);
    return successResponse(collections);
  } catch (error) {
    return handleError(error);
  }
}

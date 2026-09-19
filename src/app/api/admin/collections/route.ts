import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CollectionService } from '@/server/services/collection.service';
import { createCollectionSchema } from '@/server/validators/collection.validator';
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

    const data = createCollectionSchema.parse(body);
    const collection = await CollectionService.createCollection(data);

    return successResponse(collection, 'Collection created successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, 'ADMIN');

    const collections = await CollectionService.getCollections(false);
    return successResponse(collections);
  } catch (error) {
    return handleError(error);
  }
}

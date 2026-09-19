import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CollectionService } from '@/server/services/collection.service';
import { updateCollectionSchema } from '@/server/validators/collection.validator';
import { generateSlug } from '@/utils/slug';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

interface RouteContext {
  params: Promise<{ collectionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { collectionId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');
    const collection = await CollectionService.getCollectionById(collectionId, false);
    return successResponse(collection);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { collectionId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');

    const body = await req.json();

    if (body.name && !body.slug) {
      body.slug = generateSlug(body.name);
    } else if (body.slug) {
      body.slug = generateSlug(body.slug);
    }

    const data = updateCollectionSchema.parse(body);
    const collection = await CollectionService.updateCollection(collectionId, data);

    return successResponse(collection, 'Collection updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { collectionId } = await params;
    await AuthService.requireRole(req.headers, 'ADMIN');
    await CollectionService.deleteCollection(collectionId);
    return successResponse(null, 'Collection deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}

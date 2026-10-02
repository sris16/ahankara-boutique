import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CategoryService } from '@/server/services/category.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';
import { z } from 'zod';

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int()
  })).min(1, 'At least one update is required')
});

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, 'ADMIN');

    const body = await req.json();
    const data = reorderSchema.parse(body);

    await CategoryService.reorderCategories(data.updates);

    return successResponse(null, 'Categories reordered successfully');
  } catch (error) {
    return handleError(error);
  }
}

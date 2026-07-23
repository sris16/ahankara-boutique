import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    return successResponse(user);
  } catch (error) {
    return handleError(error);
  }
}

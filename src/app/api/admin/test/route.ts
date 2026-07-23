import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await AuthService.requireRole(req.headers, UserRole.ADMIN);
    return successResponse({
      message: 'Welcome Admin',
      admin: adminUser,
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { UserService } from '@/server/services/user.service';
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    
    // updateProfile handles validation internally via Zod
    const updatedUser = await UserService.updateProfile(user.id, body);
    
    return successResponse(updatedUser, 'Profile updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

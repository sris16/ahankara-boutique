import { NextResponse } from 'next/server';
import { handleError } from "@/utils/error-handler";
import { AuthService } from '@/server/services/auth.service';
import { ReturnService } from '@/server/services/return.service';
import { UserRole } from '@prisma/client';

// BACKEND-ONLY API - intended to be called from Order Details UI
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const updatedReturn = await ReturnService.approveReturn(resolvedParams.returnId);

    return NextResponse.json({ success: true, data: updatedReturn });
  } catch (error) {
    return handleError(error);
  }
}

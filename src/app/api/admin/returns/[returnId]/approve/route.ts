import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ReturnService } from '@/server/services/return.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const updatedReturn = await ReturnService.approveReturn(resolvedParams.returnId);

    return NextResponse.json(updatedReturn);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Approve return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

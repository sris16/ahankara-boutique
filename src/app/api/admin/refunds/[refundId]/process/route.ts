import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { RefundService } from '@/server/services/refund.service';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ refundId: string }> }
) {
  try {
    await AuthService.requireAuth(request.headers);
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const resolvedParams = await params;

    const refund = await RefundService.processRefund(resolvedParams.refundId);

    return NextResponse.json(refund, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Admin process refund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

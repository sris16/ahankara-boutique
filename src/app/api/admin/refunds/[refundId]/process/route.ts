import { NextResponse } from 'next/server';
import { handleError } from "@/utils/error-handler";
import { AuthService } from '@/server/services/auth.service';
import { RefundService } from '@/server/services/refund.service';
import { UserRole } from '@prisma/client';

// BACKEND-ONLY API - intended to be called from Order Details UI
export async function POST(
  request: Request,
  { params }: { params: Promise<{ refundId: string }> }
) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const resolvedParams = await params;

    const refund = await RefundService.processRefund(resolvedParams.refundId);

    return NextResponse.json({ success: true, data: refund });
  } catch (error) {
    return handleError(error);
  }
}

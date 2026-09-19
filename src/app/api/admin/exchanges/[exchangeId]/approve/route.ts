import { NextResponse } from 'next/server';
import { handleError } from "@/utils/error-handler";
import { AuthService } from '@/server/services/auth.service';
import { ExchangeService } from '@/server/services/exchange.service';
import { UserRole } from '@prisma/client';

// BACKEND-ONLY API - intended to be called from Order Details UI
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ exchangeId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const updatedExchange = await ExchangeService.approveExchange(resolvedParams.exchangeId);

    return NextResponse.json({ success: true, data: updatedExchange });
  } catch (error) {
    return handleError(error);
  }
}

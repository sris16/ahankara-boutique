import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ExchangeService } from '@/server/services/exchange.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ exchangeId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const updatedExchange = await ExchangeService.completeExchange(resolvedParams.exchangeId);

    return NextResponse.json(updatedExchange);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Complete exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

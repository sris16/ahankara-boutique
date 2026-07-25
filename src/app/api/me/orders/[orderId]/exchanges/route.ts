import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ExchangeService } from '@/server/services/exchange.service';
import { AppError } from '@/utils/errors';
import { z } from 'zod';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await AuthService.requireAuth(request.headers);
    const resolvedParams = await params;
    const body = await request.json();
    
    // Manual validation since we didn't extract this schema
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }

    const exchangeReq = await ExchangeService.createExchangeRequest(
      resolvedParams.orderId,
      session.id,
      { items: body.items, reason: body.reason }
    );

    return NextResponse.json(exchangeReq, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Customer exchange order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

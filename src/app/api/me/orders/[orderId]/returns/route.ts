import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ReturnService } from '@/server/services/return.service';
import { createReturnRequestSchema } from '@/server/validators/return.validator';
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
    
    const validated = createReturnRequestSchema.parse(body);

    const returnReq = await ReturnService.createReturnRequest(
      resolvedParams.orderId,
      session.id,
      validated
    );

    return NextResponse.json(returnReq, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Customer return order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
